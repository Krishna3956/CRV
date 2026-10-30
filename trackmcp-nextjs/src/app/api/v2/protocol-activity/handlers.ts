import { NextResponse } from "next/server.js";
import { createAnalyticsHandler } from "../../v1/analytics/handlers.ts";
import { withTrackMCPV2Envelope } from "../../../../lib/api/v2-envelope.ts";
import { projectTrackMCPDataTrust } from "../../../../lib/telemetry/data-trust.ts";

const FAMILIES = new Set(["sampling", "elicitation", "completion", "tasks", "control_signal", "resources", "prompts", "tools", "subscriptions", "notifications", "roots", "logging"]);
const TRANSPORTS = new Set(["stdio", "streamable_http", "sse", "custom", "unknown"]);
const boundedCount = (value: unknown, max = 100_000) => typeof value === "number" && Number.isSafeInteger(value) ? Math.max(0, Math.min(max, value)) : 0;
const boundedTransport = (value: unknown) => typeof value === "string" && TRANSPORTS.has(value) ? value : "unknown";

/**
 * Exposes the bounded modern-protocol family projection as a stable v2 read
 * surface. Counts describe metadata observed at the server boundary; they do
 * not imply demand, success, or customer workflow completion.
 */
export function createProtocolActivityHandler(analytics = createAnalyticsHandler()) {
  return async function GET(request: Request) {
    const response = await analytics(request);
    if (!response.ok) return response;
    const body = await response.json() as { range_days?: unknown; protocol_family_activity?: unknown; protocol_family_outcomes?: unknown; protocol_family_outcome_source?: unknown; protocol_transport_outcomes?: unknown; protocol_mrtr_linkage?: unknown; protocol_capability_gaps?: unknown; data_trust?: unknown };
    const activity = Array.isArray(body.protocol_family_activity)
      ? body.protocol_family_activity
        .filter((value): value is { family: string; observations: number } => Boolean(value && typeof value === "object" && typeof (value as { family?: unknown }).family === "string" && typeof (value as { observations?: unknown }).observations === "number"))
        .filter((value) => FAMILIES.has(value.family))
        .map((value) => ({ family: value.family, observations: Math.max(0, Math.min(100_000, Math.floor(value.observations))) }))
        .sort((a, b) => b.observations - a.observations || a.family.localeCompare(b.family))
        .slice(0, 10)
      : [];
    const outcomes = Array.isArray(body.protocol_family_outcomes)
      ? body.protocol_family_outcomes
        .filter((value): value is { family: string; observations: number; requests?: number; responses?: number; matched?: number; matched_advertised?: number; matched_without_advertisement?: number; matched_unknown?: number; completed: number; errors: number; input_required: number; unknown: number; capability_advertised?: boolean | null } => Boolean(value && typeof value === "object" && typeof (value as { family?: unknown }).family === "string" && ["observations", "completed", "errors", "input_required", "unknown"].every((key) => typeof (value as Record<string, unknown>)[key] === "number")))
        .filter((value) => FAMILIES.has(value.family))
        .map((value) => ({ family: value.family, observations: boundedCount(value.observations), requests: boundedCount(value.requests), responses: boundedCount(value.responses), matched: boundedCount(value.matched), matched_advertised: boundedCount(value.matched_advertised), matched_without_advertisement: boundedCount(value.matched_without_advertisement), matched_unknown: boundedCount(value.matched_unknown), completed: boundedCount(value.completed), errors: boundedCount(value.errors), input_required: boundedCount(value.input_required), unknown: boundedCount(value.unknown), capability_advertised: typeof value.capability_advertised === "boolean" ? value.capability_advertised : null }))
        .sort((a, b) => b.observations - a.observations || a.family.localeCompare(b.family))
        .slice(0, 10)
      : [];
    const outcomeSource = body.protocol_family_outcome_source === "durable_facts" || body.protocol_family_outcome_source === "event_window" ? body.protocol_family_outcome_source : null;
    const transportOutcomes = Array.isArray(body.protocol_transport_outcomes)
      ? body.protocol_transport_outcomes.flatMap((value) => {
        if (!value || typeof value !== "object" || Array.isArray(value)) return [];
        const row = value as Record<string, unknown>;
        return [{ transport: boundedTransport(row.transport), observations: boundedCount(row.observations), requests: boundedCount(row.requests), responses: boundedCount(row.responses), matched: boundedCount(row.matched), completed: boundedCount(row.completed), errors: boundedCount(row.errors), input_required: boundedCount(row.input_required), unknown: boundedCount(row.unknown) }];
      }).slice(0, 5)
      : [];
    const mrtr = body.protocol_mrtr_linkage && typeof body.protocol_mrtr_linkage === "object" && !Array.isArray(body.protocol_mrtr_linkage) ? body.protocol_mrtr_linkage as Record<string, unknown> : null;
    const mrtrLinkage = mrtr ? {
      request_state_hashes: boundedCount(mrtr.request_state_hashes),
      interaction_hashes: boundedCount(mrtr.interaction_hashes),
      retry_links: boundedCount(mrtr.retry_links),
      matched_pairs: boundedCount(mrtr.matched_pairs),
      source: mrtr.source === "durable_facts" || mrtr.source === "event_window" ? mrtr.source : "event_window",
    } : null;
    const capabilityGaps = Array.isArray(body.protocol_capability_gaps)
      ? body.protocol_capability_gaps.flatMap((value) => {
        if (!value || typeof value !== "object" || Array.isArray(value)) return [];
        const row = value as Record<string, unknown>;
        if (typeof row.family !== "string" || !FAMILIES.has(row.family)) return [];
        return [{ family: row.family, requests_without_advertisement: boundedCount(row.requests_without_advertisement), limitation: typeof row.limitation === "string" ? row.limitation.slice(0, 512) : "Capability negotiation evidence is incomplete." }];
      }).slice(0, 10)
      : [];
    return NextResponse.json(withTrackMCPV2Envelope({
      range_days: typeof body.range_days === "number" ? body.range_days : null,
      protocol_family_activity: activity,
      family_count: activity.length,
      protocol_family_outcomes: outcomes,
      protocol_family_outcome_source: outcomeSource,
      protocol_transport_outcomes: transportOutcomes,
      protocol_mrtr_linkage: mrtrLinkage,
      protocol_capability_gaps: capabilityGaps,
      data_trust: projectTrackMCPDataTrust(body.data_trust),
    }, request, { caveats: ["Counts are bounded protocol metadata observations at the server boundary, not customer demand, successful outcomes, or feature support claims.", "Completed is an explicit protocol result, not business or workflow completion; unknown remains visible when terminal evidence is absent."] }));
  };
}

export const GET = createProtocolActivityHandler();
