import type { TrackMCPFact } from "./facts.ts";
import { taskScopeForFact, type TrackMCPTaskScope } from "./task-scope.ts";

export type TrackMCPTaskState = "working" | "input_required" | "completed" | "failed" | "cancelled" | "expired";
export type TrackMCPTaskResultType = "complete" | "input_required" | "task" | null;

/**
 * Durable, privacy-safe task evidence. The task handle is represented only by
 * the one-way hash already present in the fact projection; raw task IDs and
 * task payloads never cross this boundary.
 */
export type TrackMCPTaskTransitionRow = {
  workspace_id: string;
  source_event_id: string;
  task_id_hash: string;
  service: string;
  environment: string;
  server_id: string | null;
  transport: TrackMCPTaskScope["transport"];
  state: TrackMCPTaskState;
  observed_at: string;
  result_type: TrackMCPTaskResultType;
  evidence_quality: "observed" | "insufficient_data" | "conflicting";
};

const HASH = /^[a-f0-9]{64}$/;

function resultTypeFor(state: TrackMCPTaskState): TrackMCPTaskResultType {
  if (state === "working") return "task";
  if (state === "input_required") return "input_required";
  if (state === "completed" || state === "failed" || state === "cancelled" || state === "expired") return "complete";
  return null;
}

/** Build bounded, idempotent transition rows from explicit task observations. */
export function buildTaskTransitionWrites(workspaceId: string, facts: readonly TrackMCPFact[]): TrackMCPTaskTransitionRow[] {
  const seen = new Set<string>();
  const rows: TrackMCPTaskTransitionRow[] = [];
  for (const fact of facts) {
    const taskIdHash = fact.dimensions.task_id_hash;
    const state = fact.semantic.task_status;
    if (!taskIdHash || !HASH.test(taskIdHash) || !state || seen.has(fact.source_event_id)) continue;
    seen.add(fact.source_event_id);
    rows.push({
      workspace_id: workspaceId,
      source_event_id: fact.source_event_id.slice(0, 128),
      task_id_hash: taskIdHash,
      ...taskScopeForFact(fact),
      state,
      observed_at: fact.observed_at,
      result_type: resultTypeFor(state),
      evidence_quality: fact.semantic.evidence_quality === "conflicting" ? "conflicting" : fact.semantic.evidence_quality === "observed" ? "observed" : "insufficient_data",
    });
  }
  return rows;
}

type UpsertResult = { error: { code?: string; message: string } | null };
type TaskTransitionWriterClient = {
  from(table: "trackmcp_task_transitions"): {
    upsert(rows: TrackMCPTaskTransitionRow[], options: { onConflict: string; ignoreDuplicates: boolean }): PromiseLike<UpsertResult>;
  };
};

export async function persistTrackMCPTaskTransitions(client: TaskTransitionWriterClient, rows: readonly TrackMCPTaskTransitionRow[]) {
  if (!rows.length) return { attempted: 0, error: null };
  const result = await client.from("trackmcp_task_transitions").upsert([...rows], {
    onConflict: "workspace_id,source_event_id",
    ignoreDuplicates: true,
  });
  return { attempted: rows.length, error: result.error };
}
