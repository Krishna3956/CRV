import type { TrackMCPFact } from "./facts.ts";

export const TRACKMCP_TASK_READ_MODEL_VERSION = "1" as const;

export type TrackMCPTaskState = "working" | "input_required" | "completed" | "failed" | "cancelled" | "unknown";

export type TrackMCPTaskLifecycle = {
  task_id_hash: string;
  state: TrackMCPTaskState;
  first_observed_at: string;
  last_observed_at: string;
  observations: number;
  terminal: boolean;
  evidence_quality: "observed" | "insufficient_data" | "conflicting";
};

const states = new Set<TrackMCPTaskState>(["working", "input_required", "completed", "failed", "cancelled"]);

function taskState(fact: TrackMCPFact): TrackMCPTaskState {
  const value = fact.semantic.task_status;
  return value && states.has(value) ? value : "unknown";
}

/**
 * Groups only facts that carry an opaque task hash. Missing task events never
 * create a row, and no task is called abandoned from inactivity.
 */
export function aggregateTaskLifecycles(facts: readonly TrackMCPFact[]): TrackMCPTaskLifecycle[] {
  const groups = new Map<string, TrackMCPFact[]>();
  for (const fact of facts) {
    const hash = fact.dimensions.task_id_hash;
    if (!hash || !/^[a-f0-9]{64}$/i.test(hash)) continue;
    const group = groups.get(hash) ?? [];
    group.push(fact);
    groups.set(hash, group);
  }
  return [...groups.entries()].map(([task_id_hash, rows]) => {
    const ordered = [...rows].sort((a, b) => a.observed_at.localeCompare(b.observed_at));
    const latest = ordered.at(-1)!;
    const state = taskState(latest);
    const evidence_quality: TrackMCPTaskLifecycle["evidence_quality"] = latest.semantic.evidence_quality === "conflicting" ? "conflicting" : latest.semantic.evidence_quality === "observed" ? "observed" : "insufficient_data";
    return {
      task_id_hash,
      state,
      first_observed_at: ordered[0]!.observed_at,
      last_observed_at: latest.observed_at,
      observations: Math.min(100, ordered.length),
      terminal: state === "completed" || state === "failed" || state === "cancelled",
      evidence_quality,
    };
  }).sort((a, b) => b.last_observed_at.localeCompare(a.last_observed_at)).slice(0, 100);
}
