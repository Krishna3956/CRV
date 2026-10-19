import test from "node:test";
import assert from "node:assert/strict";
import { evaluateTrackMCPActionQueue, persistTrackMCPActionQueue } from "./action-queue.ts";
import { projectTrackMCPFact } from "./facts.ts";
import type { CanonicalTrackMCPEvent } from "./types.ts";

const event = (id: string, overrides: Partial<CanonicalTrackMCPEvent> = {}): CanonicalTrackMCPEvent => ({
  schema_version: "1", event_id: id, event_type: "tool_call", service: "svc", environment: "prod",
  started_at: "2026-10-18T00:00:00.000Z", tool_name: "search", success: true, ...overrides,
});

test("opens a bounded, explainable candidate only after a minimum sample", () => {
  const facts = Array.from({ length: 6 }, (_, i) => projectTrackMCPFact(event(`evt_${i}`, { success: i < 4, is_error: i >= 4 })));
  const [candidate] = evaluateTrackMCPActionQueue("workspace-1", facts);
  assert.equal(candidate?.rule_key, "high_tool_error_rate");
  assert.equal(candidate?.evidence.failures, 2);
  assert.equal(candidate?.evidence.calls, 6);
  assert.equal(candidate?.status, "open");
});

test("does not infer an issue from too little or unresolved activity", () => {
  const facts = [projectTrackMCPFact(event("evt_1", { success: false, is_error: true }))];
  assert.deepEqual(evaluateTrackMCPActionQueue("workspace-1", facts), []);
});

test("persists new candidates without overwriting operator state", async () => {
  let captured: { rows: unknown[]; options: unknown } | undefined;
  const client = { from(table: string) {
    assert.equal(table, "trackmcp_action_queue");
    return { upsert(rows: unknown[], options: unknown) { captured = { rows, options }; return Promise.resolve({ error: null }); } };
  } };
  const candidates = evaluateTrackMCPActionQueue("workspace-1", Array.from({ length: 5 }, (_, i) => projectTrackMCPFact(event(`evt_persist_${i}`, { success: false, is_error: true }))));
  const result = await persistTrackMCPActionQueue(client, candidates);
  assert.equal(result.attempted, 1);
  assert.deepEqual(captured?.options, { onConflict: "workspace_id,fingerprint", ignoreDuplicates: true });
});

