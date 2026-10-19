import assert from "node:assert/strict";
import test from "node:test";
import { buildPrivacyDeletionPlan, initialPrivacyDeletionCheckpoint } from "./privacy-deletion-plan.ts";
import { PRIVACY_DELETION_PREVIEW_POLICY, runPrivacyDeletionPreview } from "./privacy-deletion-preview-worker.ts";

const workspaceId = "11111111-1111-4111-8111-111111111111";

function plan() {
  const result = buildPrivacyDeletionPlan({ requestId: "r1", workspaceId, status: "approved", batchSize: 2 });
  assert.equal(result.ok, true);
  if (!result.ok) throw new Error("expected plan");
  return result.plan;
}

test("preview worker is bounded, resumable, and records the same workspace scope", async () => {
  const calls: Array<Record<string, unknown>> = [];
  const audits: Array<Record<string, unknown>> = [];
  const result = await runPrivacyDeletionPreview(plan(), {
    async previewBatch(input) {
      calls.push(input);
      return input.dataset === "events"
        ? { returnedCount: 2, lastId: "event-2", hasMore: input.afterId === null }
        : { returnedCount: 0, lastId: null, hasMore: false };
    },
  }, { async recordPreview(input) { audits.push(input); } }, initialPrivacyDeletionCheckpoint(), { maxBatches: 2 });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.batches, 2);
  assert.equal(result.checkpoint.dataset, "semantic_facts");
  assert.equal(calls[0].workspaceId, workspaceId);
  assert.equal(calls[0].requestId, "r1");
  assert.deepEqual(audits.map((item) => item.dataset), ["events", "events"]);
  assert.equal("delete" in calls[0], false);
});

test("preview worker refuses an unsafe plan and has no destructive policy", async () => {
  const unsafe = { ...plan(), dry_run: false } as never;
  const result = await runPrivacyDeletionPreview(unsafe, {} as never, {} as never, initialPrivacyDeletionCheckpoint());
  assert.equal(result.ok, false);
  assert.equal(PRIVACY_DELETION_PREVIEW_POLICY.destructiveOperations, false);
});

test("preview worker stops cleanly on cancellation before another read", async () => {
  const controller = new AbortController();
  controller.abort();
  let reads = 0;
  const result = await runPrivacyDeletionPreview(plan(), { async previewBatch() { reads += 1; return { returnedCount: 0, lastId: null, hasMore: false }; } }, { async recordPreview() {} }, initialPrivacyDeletionCheckpoint(), { signal: controller.signal });
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.aborted, true);
  assert.equal(reads, 0);
});
