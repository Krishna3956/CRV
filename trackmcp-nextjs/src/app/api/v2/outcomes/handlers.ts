import { NextResponse } from "next/server.js";
import { createAnalyticsHandler } from "../../v1/analytics/handlers.ts";
import { withTrackMCPV2Envelope } from "../../../../lib/api/v2-envelope.ts";

export function createOutcomesHandler(analytics = createAnalyticsHandler()) {
  return async function GET(request: Request) {
    const response = await analytics(request);
    if (!response.ok) return response;
    const body = await response.json() as {
      range_days?: unknown;
      outcomes?: unknown;
      completion_rate?: unknown;
      completion_source?: unknown;
      outcome_activity?: {
        completed?: unknown; failed?: unknown; pending?: unknown; unknown?: unknown; not_observable?: unknown;
        task_states?: unknown; completion_rate?: unknown; error_rate?: unknown;
      };
      founder_os?: {
        groups?: unknown;
        facts?: {
          workflow_completion_rate?: unknown;
          terminal_workflow_completed?: unknown;
          terminal_workflow_outcomes?: unknown;
          unresolved_facts?: unknown;
          evidence_quality?: unknown;
        };
      };
      data_trust?: unknown;
    };
    const outcomes = Array.isArray(body.outcomes) ? body.outcomes.slice(0, 100) : [];
    const terminalCount = outcomes.reduce((count, row) => {
      if (!row || typeof row !== "object") return count;
      const item = row as { completed?: unknown; failed?: unknown };
      return count + (typeof item.completed === "number" ? item.completed : 0) + (typeof item.failed === "number" ? item.failed : 0);
    }, 0);
    const facts = body.founder_os?.facts;
    const activity = body.outcome_activity;
    const factTerminalCount = typeof facts?.terminal_workflow_outcomes === "number" && Number.isInteger(facts.terminal_workflow_outcomes) ? Math.max(0, facts.terminal_workflow_outcomes) : null;
    const factCompletionRate = typeof facts?.workflow_completion_rate === "number" ? facts.workflow_completion_rate : null;
    const terminalDenominator = factTerminalCount ?? terminalCount;
    const completionRate = factCompletionRate ?? (typeof body.completion_rate === "number" ? body.completion_rate : null);
    return NextResponse.json(withTrackMCPV2Envelope({
      range_days: typeof body.range_days === "number" ? body.range_days : null,
      outcomes,
      completion: {
        rate: typeof activity?.completion_rate === "number" ? activity.completion_rate : completionRate,
        source: body.completion_source ?? "not_observable",
        evidence_state: terminalDenominator > 0 ? "observed" : "insufficient_data",
        terminal_denominator: terminalDenominator,
        terminal_completed: typeof facts?.terminal_workflow_completed === "number" ? facts.terminal_workflow_completed : null,
        unresolved_facts: typeof facts?.unresolved_facts === "number" ? facts.unresolved_facts : null,
        evidence_quality: facts?.evidence_quality ?? null,
      },
      semantic_outcomes: activity ? {
        completed: activity.completed ?? 0,
        failed: activity.failed ?? 0,
        pending: activity.pending ?? 0,
        unknown: activity.unknown ?? 0,
        not_observable: activity.not_observable ?? 0,
        error_rate: activity.error_rate ?? null,
        task_states: activity.task_states ?? null,
      } : null,
      groups: body.founder_os?.groups ?? {},
      data_trust: body.data_trust ?? null,
      caveats: [
        "An outcome is reported only when the selected protocol evidence supports it.",
        "Missing or ambiguous terminal evidence remains unknown; it is not counted as success.",
        "Completion uses explicit terminal workflow facts when available; generic tool activity is not treated as workflow completion.",
      ],
    }, request));
  };
}

export const GET = createOutcomesHandler();
