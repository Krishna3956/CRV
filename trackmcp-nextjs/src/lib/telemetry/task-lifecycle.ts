import type { TrackMCPFact } from "./facts.ts";

export const TRACKMCP_TASK_READ_MODEL_VERSION = "1" as const;

export type TrackMCPTaskState = "working" | "input_required" | "completed" | "failed" | "cancelled" | "expired" | "unknown";

export type TrackMCPTaskLifecycle = {
  task_id_hash: string;
  state: TrackMCPTaskState;
  first_observed_at: string;
  last_observed_at: string;
  observations: number;
  terminal: boolean;
  evidence_quality: "observed" | "insufficient_data" | "conflicting";
};

export type TrackMCPTaskTransitionObservation = {
  task_id_hash: string;
  state: Exclude<TrackMCPTaskState, "unknown">;
  observed_at: string;
  evidence_quality: TrackMCPTaskLifecycle["evidence_quality"];
};

const states = new Set<TrackMCPTaskState>(["working", "input_required", "completed", "failed", "cancelled", "expired"]);

function taskState(fact: TrackMCPFact): TrackMCPTaskState {
  const value = fact.semantic.task_status;
  return value && states.has(value) ? value : "unknown";
}

/**
 * Groups only facts that carry an opaque task hash. Missing task events never
 * create a row, and no task is called abandoned from inactivity.
 */
export function aggregateTaskLifecycles(facts: readonly TrackMCPFact[], transitions: readonly TrackMCPTaskTransitionObservation[] = []): TrackMCPTaskLifecycle[] {
  const groups = new Map<string, Array<{ observed_at: string; state: TrackMCPTaskState; evidence_quality: TrackMCPTaskLifecycle["evidence_quality"] }>>();
  for (const fact of facts) {
    const hash = fact.dimensions.task_id_hash;
    if (!hash || !/^[a-f0-9]{64}$/i.test(hash)) continue;
    const group = groups.get(hash) ?? [];
    group.push({ observed_at: fact.observed_at, state: taskState(fact), evidence_quality: fact.semantic.evidence_quality === "conflicting" ? "conflicting" : fact.semantic.evidence_quality === "observed" ? "observed" : "insufficient_data" });
    groups.set(hash, group);
  }
  for (const transition of transitions) {
    if (!/^[a-f0-9]{64}$/i.test(transition.task_id_hash) || !states.has(transition.state)) continue;
    const group = groups.get(transition.task_id_hash) ?? [];
    group.push({ observed_at: transition.observed_at, state: transition.state, evidence_quality: transition.evidence_quality });
    groups.set(transition.task_id_hash, group);
  }
  return [...groups.entries()].map(([task_id_hash, rows]) => {
    const ordered = [...rows].sort((a, b) => a.observed_at.localeCompare(b.observed_at));
    const latest = ordered.at(-1)!;
    return {
      task_id_hash,
      state: latest.state,
      first_observed_at: ordered[0]!.observed_at,
      last_observed_at: latest.observed_at,
      observations: Math.min(100, ordered.length),
      terminal: latest.state === "completed" || latest.state === "failed" || latest.state === "cancelled" || latest.state === "expired",
      evidence_quality: latest.evidence_quality,
    };
  }).sort((a, b) => b.last_observed_at.localeCompare(a.last_observed_at)).slice(0, 100);
}
