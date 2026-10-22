import { NextResponse } from "next/server.js";
import { createAnalyticsHandler } from "../../v1/analytics/handlers.ts";
import { withTrackMCPV2Envelope } from "../../../../lib/api/v2-envelope.ts";
import { projectTrackMCPDataTrust } from "../../../../lib/telemetry/data-trust.ts";

const MAX_TEXT = 256;
const boundedText = (value: unknown) => typeof value === "string" ? value.slice(0, MAX_TEXT) : null;
const boundedInt = (value: unknown, max = 1000000) => typeof value === "number" && Number.isSafeInteger(value) ? Math.max(0, Math.min(max, value)) : 0;
const COMPLETION_SOURCES = new Set(["workflow_events", "explicit_outcome", "none", "session_heuristic"]);
const CORRELATION_SOURCES = new Set(["external", "issued", "missing"]);
const CORRELATION_QUALITY = new Set(["session_id", "external", "transport_generated", "missing", "mixed"]);

function projectJourney(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  return {
    session_id: boundedText(row.session_id),
    correlation_handle: boundedText(row.correlation_handle),
    correlation_handle_source: typeof row.correlation_handle_source === "string" && CORRELATION_SOURCES.has(row.correlation_handle_source) ? row.correlation_handle_source : null,
    client_name: boundedText(row.client_name),
    calls: boundedInt(row.calls),
    tools: Array.isArray(row.tools) ? row.tools.filter((tool): tool is string => typeof tool === "string").map((tool) => tool.slice(0, MAX_TEXT)).slice(0, 200) : [],
    started_at: boundedText(row.started_at),
    duration_ms: boundedInt(row.duration_ms, 86_400_000),
    completed: row.completed === true,
    completion_source: typeof row.completion_source === "string" && COMPLETION_SOURCES.has(row.completion_source) ? row.completion_source : "none",
    correlation_quality: typeof row.correlation_quality === "string" && CORRELATION_QUALITY.has(row.correlation_quality) ? row.correlation_quality : "missing",
  };
}

function journeySummary(workflows: readonly unknown[]) {
  let explicitlyCompleted = 0;
  let explicitlyFailed = 0;
  let unresolved = 0;
  for (const value of workflows) {
    if (!value || typeof value !== "object") {
      unresolved += 1;
      continue;
    }
    const row = value as { completed?: unknown; completion_source?: unknown };
    if (row.completion_source !== "workflow_events") {
      unresolved += 1;
    } else if (row.completed === true) {
      explicitlyCompleted += 1;
    } else {
      explicitlyFailed += 1;
    }
  }
  const terminal = explicitlyCompleted + explicitlyFailed;
  return {
    observed: workflows.length,
    explicitly_completed: explicitlyCompleted,
    explicitly_failed: explicitlyFailed,
    unresolved,
    completion_rate: terminal > 0 ? explicitlyCompleted / terminal : null,
    evidence_state: terminal > 0 ? "observed" as const : workflows.length ? "insufficient_data" as const : "no_observations" as const,
  };
}

export function createJourneysHandler(analytics = createAnalyticsHandler()) {
  return async function GET(request: Request) {
    const response = await analytics(request);
    if (!response.ok) return response;
    const body = await response.json() as { range_days?: unknown; workflows?: unknown; correlation_quality?: unknown; data_trust?: unknown };
    const workflows = Array.isArray(body.workflows) ? body.workflows.slice(0, 100).map(projectJourney).filter((journey): journey is Record<string, unknown> => journey !== null) : [];
    return NextResponse.json(withTrackMCPV2Envelope({
      range_days: typeof body.range_days === "number" ? body.range_days : null,
      journeys: workflows,
      journey_count: workflows.length,
      journey_summary: journeySummary(workflows),
      correlation_quality: body.correlation_quality ?? "unknown",
      data_trust: projectTrackMCPDataTrust(body.data_trust),
      caveats: [
        "A journey is a correlated observed session, not a unique person or organization.",
        "Sessions without a stable protocol correlation handle may be incomplete or ambiguous.",
        "Unresolved journeys are not counted as abandoned; only explicit workflow terminal events contribute to completion_rate.",
      ],
    }, request));
  };
}

export const GET = createJourneysHandler();
