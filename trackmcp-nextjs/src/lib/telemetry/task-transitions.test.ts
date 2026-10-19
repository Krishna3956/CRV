import assert from "node:assert/strict";
import test from "node:test";
import { buildTaskTransitionWrites, persistTrackMCPTaskTransitions } from "./task-transitions.ts";

const hash = "a".repeat(64);
const fact = (source_event_id: string, state: "working" | "input_required" | "completed" | "failed" | "cancelled" | "expired") => ({
  fact_version: "1" as const, fact_type: "observation" as const, source_event_id, observed_at: "2026-01-01T00:00:00Z", event_type: "protocol" as const,
  service: "demo", environment: "production", semantic: { contract_version: "1" as const, classifier_version: "1" as const, source_event_id, scope: "task" as const, outcome: state === "completed" ? "completed" as const : "pending" as const, evidence_quality: "observed" as const, reason: "task_pending" as const, task_status: state, data_quality: { flags: [], score: "good" as const } },
  dimensions: { task_id_hash: hash }, measures: {},
});

test("writes only explicit bounded task states and deduplicates source events", () => {
  const rows = buildTaskTransitionWrites("workspace-1", [fact("evt-1", "working"), fact("evt-1", "completed"), fact("evt-2", "input_required"), { ...fact("evt-3", "failed"), dimensions: { task_id_hash: "raw-task-id" } }]);
  assert.deepEqual(rows.map((row) => [row.source_event_id, row.state, row.result_type]), [["evt-1", "working", "task"], ["evt-2", "input_required", "input_required"]]);
  assert.equal(JSON.stringify(rows).includes("raw-task-id"), false);
  assert.equal(JSON.stringify(rows).includes("payload"), false);
});

test("persists idempotently with service-role writer contract", async () => {
  let received: unknown[] = [];
  const result = await persistTrackMCPTaskTransitions({ from() { return { upsert(rows: unknown[], options: unknown) { received = rows; assert.deepEqual(options, { onConflict: "workspace_id,source_event_id", ignoreDuplicates: true }); return Promise.resolve({ error: null }); } }; } }, buildTaskTransitionWrites("workspace-1", [fact("evt-1", "completed")]));
  assert.equal(result.attempted, 1);
  assert.equal(received.length, 1);
});
