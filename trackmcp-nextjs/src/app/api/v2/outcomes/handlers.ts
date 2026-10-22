import { NextResponse } from "next/server.js";
import { createAnalyticsHandler } from "../../v1/analytics/handlers.ts";
import { withTrackMCPV2Envelope } from "../../../../lib/api/v2-envelope.ts";
import { projectTrackMCPDataTrust } from "../../../../lib/telemetry/data-trust.ts";

const OUTCOME_KEYS = ["completed", "failed", "pending", "unknown", "not_observable"] as const;
const QUALITY_KEYS = ["observed", "inferred", "insufficient_data", "conflicting"] as const;
const boundedInt = (value: unknown, max = 1000000) => typeof value === "number" && Number.isSafeInteger(value) ? Math.max(0, Math.min(max, value)) : 0;
const boundedRate = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : null;

function boundedCounts(value: unknown, keys: readonly string[]): Record<string, number> {
  const row = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  return Object.fromEntries(keys.map((key) => [key, boundedInt(row[key])]));
}

function projectAggregate(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  return {
    read_model_version: typeof row.read_model_version === "string" ? row.read_model_version.slice(0, 32) : null,
    ...(typeof row.group_key === "string" ? { group_key: row.group_key.slice(0, 128) } : {}),
    total_facts: boundedInt(row.total_facts), activity_facts: boundedInt(row.activity_facts), outcome_facts: boundedInt(row.outcome_facts),
    outcomes: boundedCounts(row.outcomes, OUTCOME_KEYS), evidence_quality: boundedCounts(row.evidence_quality, QUALITY_KEYS),
    error_rate: boundedRate(row.error_rate), workflow_completion_rate: boundedRate(row.workflow_completion_rate),
    terminal_workflow_completed: boundedInt(row.terminal_workflow_completed), terminal_workflow_outcomes: boundedInt(row.terminal_workflow_outcomes), unresolved_facts: boundedInt(row.unresolved_facts),
  };
}

function projectOutcome(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  return { name: typeof row.name === "string" ? row.name.slice(0, 128) : null, started: boundedInt(row.started), completed: boundedInt(row.completed), failed: boundedInt(row.failed), unresolved: boundedInt(row.unresolved) };
}

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
    const outcomes = Array.isArray(body.outcomes) ? body.outcomes.slice(0, 100).map(projectOutcome).filter((outcome): outcome is Record<string, unknown> => outcome !== null) : [];
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
        evidence_quality: boundedCounts(facts?.evidence_quality, QUALITY_KEYS),
      },
      semantic_outcomes: activity ? {
        completed: activity.completed ?? 0,
        failed: activity.failed ?? 0,
        pending: activity.pending ?? 0,
        unknown: activity.unknown ?? 0,
        not_observable: activity.not_observable ?? 0,
        error_rate: activity.error_rate ?? null,
        task_states: boundedCounts(activity.task_states, ["working", "input_required", "completed", "failed", "cancelled", "expired", "unknown"]),
      } : null,
      groups: body.founder_os?.groups && typeof body.founder_os.groups === "object" && !Array.isArray(body.founder_os.groups)
        ? Object.fromEntries(Object.entries(body.founder_os.groups).slice(0, 8).map(([key, value]) => [key.slice(0, 64), Array.isArray(value) ? value.slice(0, 100).map(projectAggregate).filter((aggregate): aggregate is Record<string, unknown> => aggregate !== null) : []]))
        : {},
      data_trust: projectTrackMCPDataTrust(body.data_trust),
      caveats: [
        "An outcome is reported only when the selected protocol evidence supports it.",
        "Missing or ambiguous terminal evidence remains unknown; it is not counted as success.",
        "Completion uses explicit terminal workflow facts when available; generic tool activity is not treated as workflow completion.",
      ],
    }, request));
  };
}

export const GET = createOutcomesHandler();
