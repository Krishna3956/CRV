import type { TrackMCPFact } from "./facts.ts";
import type { TrackMCPOutcome } from "./semantic.ts";

/** Version for the bounded outcomes/reliability read model. */
export const TRACKMCP_OUTCOMES_READ_MODEL_VERSION = "1" as const;

export type TrackMCPOutcomeCounts = Record<TrackMCPOutcome, number>;
export type TrackMCPQualityCounts = Record<TrackMCPFact["semantic"]["evidence_quality"], number>;
export type TrackMCPOutcomeGroupBy = "service" | "environment" | "tool_name" | "client_name" | "transport";

export type TrackMCPOutcomeAggregate = {
  read_model_version: typeof TRACKMCP_OUTCOMES_READ_MODEL_VERSION;
  group_key?: string;
  total_facts: number;
  activity_facts: number;
  outcome_facts: number;
  outcomes: TrackMCPOutcomeCounts;
  evidence_quality: TrackMCPQualityCounts;
  /** Failed known outcomes / all known terminal outcomes. Null means N/A. */
  error_rate: number | null;
  /** Completed workflow outcomes / known terminal workflow outcomes. Null means N/A. */
  workflow_completion_rate: number | null;
  /** Explicit terminal workflow denominator and completed numerator. */
  terminal_workflow_completed: number;
  terminal_workflow_outcomes: number;
  /** Number of facts with no definitive terminal result. */
  unresolved_facts: number;
};

const outcomeKeys: TrackMCPOutcome[] = ["completed", "failed", "pending", "unknown", "not_observable"];
const qualityKeys: TrackMCPQualityCounts extends Record<infer K, number> ? K[] : never = ["observed", "inferred", "insufficient_data", "conflicting"];

function emptyCounts<T extends string>(keys: readonly T[]): Record<T, number> {
  return Object.fromEntries(keys.map((key) => [key, 0])) as Record<T, number>;
}

function safeRate(numerator: number, denominator: number): number | null {
  return denominator > 0 ? numerator / denominator : null;
}

function aggregateOne(facts: readonly TrackMCPFact[], group_key?: string): TrackMCPOutcomeAggregate {
  const outcomes = emptyCounts(outcomeKeys);
  const evidence_quality = emptyCounts(qualityKeys);
  let activity_facts = 0;
  let outcome_facts = 0;
  let terminalWorkflowCompleted = 0;
  let terminalWorkflowOutcomes = 0;

  for (const fact of facts) {
    outcomes[fact.semantic.outcome] += 1;
    evidence_quality[fact.semantic.evidence_quality] += 1;
    if (fact.fact_type === "activity") activity_facts += 1;
    if (fact.fact_type === "outcome") {
      outcome_facts += 1;
      if (fact.event_type === "workflow" && (fact.semantic.outcome === "completed" || fact.semantic.outcome === "failed")) {
        terminalWorkflowOutcomes += 1;
        if (fact.semantic.outcome === "completed") terminalWorkflowCompleted += 1;
      }
    }
  }

  const knownTerminal = outcomes.completed + outcomes.failed;
  return {
    read_model_version: TRACKMCP_OUTCOMES_READ_MODEL_VERSION,
    ...(group_key === undefined ? {} : { group_key }),
    total_facts: facts.length,
    activity_facts,
    outcome_facts,
    outcomes,
    evidence_quality,
    error_rate: safeRate(outcomes.failed, knownTerminal),
    workflow_completion_rate: safeRate(terminalWorkflowCompleted, terminalWorkflowOutcomes),
    terminal_workflow_completed: terminalWorkflowCompleted,
    terminal_workflow_outcomes: terminalWorkflowOutcomes,
    unresolved_facts: outcomes.pending + outcomes.unknown + outcomes.not_observable,
  };
}

function dimensionValue(fact: TrackMCPFact, groupBy: TrackMCPOutcomeGroupBy): string | undefined {
  const value = groupBy === "service"
    ? fact.service
    : groupBy === "environment"
      ? fact.environment
      : groupBy === "transport"
        ? fact.dimensions.transport
        : fact.dimensions[groupBy];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

/** Aggregate already-projected facts without inferring outcomes from missing data. */
export function aggregateTrackMCPFacts(facts: readonly TrackMCPFact[]): TrackMCPOutcomeAggregate {
  return aggregateOne(facts);
}

/** Group by one bounded, non-identity dimension and retain an explicit unknown bucket. */
export function aggregateTrackMCPFactsBy(
  facts: readonly TrackMCPFact[],
  groupBy: TrackMCPOutcomeGroupBy,
): TrackMCPOutcomeAggregate[] {
  const groups = new Map<string, TrackMCPFact[]>();
  for (const fact of facts) {
    const key = dimensionValue(fact, groupBy) ?? "unknown";
    const group = groups.get(key) ?? [];
    group.push(fact);
    groups.set(key, group);
  }
  return [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([group_key, groupedFacts]) => aggregateOne(groupedFacts, group_key));
}
