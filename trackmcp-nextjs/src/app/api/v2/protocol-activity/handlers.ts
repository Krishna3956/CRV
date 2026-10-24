import { NextResponse } from "next/server.js";
import { createAnalyticsHandler } from "../../v1/analytics/handlers.ts";
import { withTrackMCPV2Envelope } from "../../../../lib/api/v2-envelope.ts";
import { projectTrackMCPDataTrust } from "../../../../lib/telemetry/data-trust.ts";

const FAMILIES = new Set(["sampling", "elicitation", "completion", "tasks", "control_signal", "resources", "prompts", "tools", "subscriptions", "notifications"]);

/**
 * Exposes the bounded modern-protocol family projection as a stable v2 read
 * surface. Counts describe metadata observed at the server boundary; they do
 * not imply demand, success, or customer workflow completion.
 */
export function createProtocolActivityHandler(analytics = createAnalyticsHandler()) {
  return async function GET(request: Request) {
    const response = await analytics(request);
    if (!response.ok) return response;
    const body = await response.json() as { range_days?: unknown; protocol_family_activity?: unknown; protocol_family_outcomes?: unknown; protocol_family_outcome_source?: unknown; data_trust?: unknown };
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
        .filter((value): value is { family: string; observations: number; requests?: number; responses?: number; matched?: number; completed: number; errors: number; input_required: number; unknown: number; capability_advertised?: boolean | null } => Boolean(value && typeof value === "object" && typeof (value as { family?: unknown }).family === "string" && ["observations", "completed", "errors", "input_required", "unknown"].every((key) => typeof (value as Record<string, unknown>)[key] === "number")))
        .filter((value) => FAMILIES.has(value.family))
        .map((value) => ({ family: value.family, observations: Math.max(0, Math.min(100_000, Math.floor(value.observations))), requests: Math.max(0, Math.min(100_000, Math.floor(value.requests ?? 0))), responses: Math.max(0, Math.min(100_000, Math.floor(value.responses ?? 0))), matched: Math.max(0, Math.min(100_000, Math.floor(value.matched ?? 0))), completed: Math.max(0, Math.min(100_000, Math.floor(value.completed))), errors: Math.max(0, Math.min(100_000, Math.floor(value.errors))), input_required: Math.max(0, Math.min(100_000, Math.floor(value.input_required))), unknown: Math.max(0, Math.min(100_000, Math.floor(value.unknown))), capability_advertised: typeof value.capability_advertised === "boolean" ? value.capability_advertised : null }))
        .sort((a, b) => b.observations - a.observations || a.family.localeCompare(b.family))
        .slice(0, 10)
      : [];
    const outcomeSource = body.protocol_family_outcome_source === "durable_facts" || body.protocol_family_outcome_source === "event_window" ? body.protocol_family_outcome_source : null;
    return NextResponse.json(withTrackMCPV2Envelope({
      range_days: typeof body.range_days === "number" ? body.range_days : null,
      protocol_family_activity: activity,
      family_count: activity.length,
      protocol_family_outcomes: outcomes,
      protocol_family_outcome_source: outcomeSource,
      data_trust: projectTrackMCPDataTrust(body.data_trust),
    }, request, { caveats: ["Counts are bounded protocol metadata observations at the server boundary, not customer demand, successful outcomes, or feature support claims.", "Completed is an explicit protocol result, not business or workflow completion; unknown remains visible when terminal evidence is absent."] }));
  };
}

export const GET = createProtocolActivityHandler();
