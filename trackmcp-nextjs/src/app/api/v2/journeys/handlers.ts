import { NextResponse } from "next/server.js";
import { createAnalyticsHandler } from "../../v1/analytics/handlers.ts";
import { withTrackMCPV2Envelope } from "../../../../lib/api/v2-envelope.ts";

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
    const workflows = Array.isArray(body.workflows) ? body.workflows.slice(0, 100) : [];
    return NextResponse.json(withTrackMCPV2Envelope({
      range_days: typeof body.range_days === "number" ? body.range_days : null,
      journeys: workflows,
      journey_count: workflows.length,
      journey_summary: journeySummary(workflows),
      correlation_quality: body.correlation_quality ?? "unknown",
      data_trust: body.data_trust ?? null,
      caveats: [
        "A journey is a correlated observed session, not a unique person or organization.",
        "Sessions without a stable protocol correlation handle may be incomplete or ambiguous.",
        "Unresolved journeys are not counted as abandoned; only explicit workflow terminal events contribute to completion_rate.",
      ],
    }, request));
  };
}

export const GET = createJourneysHandler();
