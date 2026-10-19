import test from "node:test";
import assert from "node:assert/strict";
import { persistTrackMCPActionQueueTransition, transitionTrackMCPActionQueueItem, type TrackMCPActionQueueItem, type TrackMCPActionQueueLifecycleResult, type TrackMCPActionQueueLifecycleStore } from "./action-queue-lifecycle.ts";

const base: TrackMCPActionQueueItem = { id: "item-1", workspace_id: "workspace-1", status: "open", revision: 2 };
const actor = { actor_id: "user-1", workspace_id: "workspace-1", can_manage_action_queue: true };
function errorCode(result: TrackMCPActionQueueLifecycleResult): string | undefined { return result.ok ? undefined : result.code; }

test("acknowledges only an authorized workspace item", () => {
  const result = transitionTrackMCPActionQueueItem(base, { action: "acknowledge" }, actor, new Date("2026-10-18T00:00:00.000Z"));
  assert.equal(result.ok, true);
  if (result.ok) assert.deepEqual({ status: result.item.status, acknowledged_by: result.item.acknowledged_by, revision: result.item.revision }, { status: "acknowledged", acknowledged_by: "user-1", revision: 3 });
  assert.equal(errorCode(transitionTrackMCPActionQueueItem(base, { action: "acknowledge" }, { ...actor, can_manage_action_queue: false })), "unauthorized");
  assert.equal(errorCode(transitionTrackMCPActionQueueItem(base, { action: "acknowledge" }, { ...actor, workspace_id: "other" })), "unauthorized");
});

test("bounds snooze and resolution note", () => {
  const now = new Date("2026-10-18T00:00:00.000Z");
  assert.equal(errorCode(transitionTrackMCPActionQueueItem(base, { action: "snooze", until: "2026-10-17T00:00:00.000Z" }, actor, now)), "invalid_input");
  assert.equal(errorCode(transitionTrackMCPActionQueueItem(base, { action: "snooze", until: "2026-12-01T00:00:00.000Z" }, actor, now)), "invalid_input");
  assert.equal(errorCode(transitionTrackMCPActionQueueItem(base, { action: "resolve", note: "x".repeat(501) }, actor, now)), "invalid_input");
  const result = transitionTrackMCPActionQueueItem(base, { action: "snooze", until: "2026-10-20T00:00:00.000Z" }, actor, now);
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.item.snoozed_until, "2026-10-20T00:00:00.000Z");
});

test("resolved items are terminal and acknowledge is idempotent", () => {
  const resolved = { ...base, status: "resolved" as const, resolved_at: "2026-10-18T00:00:00.000Z" };
  assert.equal(errorCode(transitionTrackMCPActionQueueItem(resolved, { action: "acknowledge" }, actor)), "invalid_transition");
  const acknowledged = { ...base, status: "acknowledged" as const, acknowledged_at: "2026-10-18T00:00:00.000Z", acknowledged_by: "user-1" };
  const result = transitionTrackMCPActionQueueItem(acknowledged, { action: "acknowledge" }, actor);
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.changed, false);
});

test("persists with workspace and optimistic revision predicates", async () => {
  const calls: Array<[string, unknown]> = [];
  const store: TrackMCPActionQueueLifecycleStore = { from() {
    const query = {
      update(values: unknown) { calls.push(["update", values]); return query; },
      eq(field: string, value: unknown) { calls.push([field, value]); return query; },
      select(columns: string) { calls.push(["select", columns]); return query; },
      maybeSingle: async () => ({ data: { ...base, status: "acknowledged" as const, revision: 3 }, error: null }),
    };
    return query;
  } };
  const next = transitionTrackMCPActionQueueItem(base, { action: "acknowledge" }, actor, new Date("2026-10-18T00:00:00.000Z"));
  assert.equal(next.ok, true);
  if (next.ok) {
    const result = await persistTrackMCPActionQueueTransition(store, base, next.item);
    assert.equal(result.ok, true);
    assert.deepEqual(calls.slice(1, 3), [["workspace_id", "workspace-1"], ["id", "item-1"]]);
    assert.deepEqual(calls[3], ["revision", 2]);
  }
});
