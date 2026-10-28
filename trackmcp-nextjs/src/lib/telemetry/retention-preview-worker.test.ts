import assert from "node:assert/strict";
import test from "node:test";
import {
  RETENTION_PREVIEW_POLICY,
  advanceRetentionPreviewCheckpoint,
  buildRetentionPreviewPlan,
  initialRetentionPreviewCheckpoint,
  nextRetentionPreviewBatch,
  runRetentionPreview,
  type RetentionPreviewPlan,
} from "./retention-preview-worker.ts";

const workspaceId = "11111111-1111-4111-8111-111111111111";

function plan(): RetentionPreviewPlan {
  const result = buildRetentionPreviewPlan({ requestId: "retention-review-1", workspaceId, batchSize: 2, asOf: new Date("2026-10-29T12:00:00.000Z") });
  assert.equal(result.ok, true);
  if (!result.ok) throw new Error("plan should be valid");
  return result.plan;
}

test("builds a deterministic dry-run plan with policy cutoffs", () => {
  const current = plan();
  assert.equal(current.dry_run, true);
  assert.equal(current.policy_version, "v1");
  assert.deepEqual(current.datasets, ["raw_events", "semantic_facts", "action_queue", "diagnostics"]);
  assert.equal(nextRetentionPreviewBatch(current, initialRetentionPreviewCheckpoint())?.cutoff, "2026-07-31T12:00:00.000Z");
});

test("rejects malformed scope, request, and time inputs", () => {
  assert.equal(buildRetentionPreviewPlan({ requestId: "bad space", workspaceId }).ok, false);
  assert.equal(buildRetentionPreviewPlan({ requestId: "ok", workspaceId: "not-a-uuid" }).ok, false);
  assert.equal(buildRetentionPreviewPlan({ requestId: "ok", workspaceId, asOf: new Date("invalid") }).ok, false);
});

test("advances within a dataset and then moves to the next dataset", () => {
  const start = initialRetentionPreviewCheckpoint();
  const page = advanceRetentionPreviewCheckpoint(start, 2, "event-2", true);
  assert.deepEqual(page, { ok: true, checkpoint: { dataset: "raw_events", after_id: "event-2", batch_number: 1 } });
  const next = advanceRetentionPreviewCheckpoint(page.ok ? page.checkpoint : start, 0, null, false);
  assert.deepEqual(next, { ok: true, checkpoint: { dataset: "semantic_facts", after_id: null, batch_number: 2 } });
});

test("fails closed when a continuation has no bounded cursor", () => {
  assert.deepEqual(advanceRetentionPreviewCheckpoint(initialRetentionPreviewCheckpoint(), 1, "not allowed/with space", true), {
    ok: false,
    reason: "a bounded last_id is required when more rows remain",
  });
});

test("previews every dataset, audits each batch, and never exposes a delete method", async () => {
  const current = plan();
  const batches: string[] = [];
  const completed: string[] = [];
  const result = await runRetentionPreview(current, {
    async previewBatch(batch) {
      batches.push(`${batch.dataset}:${batch.table}:${batch.timestamp_column}:${batch.cutoff}`);
      return { candidateCount: 0, lastId: null, hasMore: false };
    },
  }, {
    async recordBatch(batch) { assert.equal(batch.dry_run, true); batches.push(`audit:${batch.dataset}`); },
    async complete(input) { completed.push(`${input.requestId}:${input.policyVersion}:${input.asOf}`); },
  }, initialRetentionPreviewCheckpoint(), { maxBatches: 10 });
  assert.equal(result.ok, true);
  if (!result.ok) throw new Error("preview should succeed");
  assert.equal(result.complete, true);
  assert.equal(result.candidateCount, 0);
  assert.equal(batches.filter((entry) => entry.startsWith("audit:")).length, 4);
  assert.equal(completed.length, 1);
  assert.equal(RETENTION_PREVIEW_POLICY.destructiveOperations, false);
});

test("resumes and aborts at a bounded checkpoint", async () => {
  const current = plan();
  const controller = new AbortController();
  let calls = 0;
  const result = await runRetentionPreview(current, {
    async previewBatch(batch) {
      calls += 1;
      controller.abort();
      return { candidateCount: batch.limit, lastId: "row-1", hasMore: true };
    },
  }, { async recordBatch() {}, async complete() {} }, initialRetentionPreviewCheckpoint(), { maxBatches: 10, signal: controller.signal });
  assert.equal(result.ok, true);
  if (!result.ok) throw new Error("preview should return a bounded result");
  assert.equal(result.aborted, true);
  assert.equal(calls, 1);
  assert.equal(result.checkpoint.dataset, "raw_events");
  assert.equal(result.checkpoint.after_id, "row-1");
});

test("rejects invalid store and invalid returned counts", async () => {
  const current = plan();
  const checkpoint = initialRetentionPreviewCheckpoint();
  const invalidStore = await runRetentionPreview(current, null as never, null as never, checkpoint);
  assert.equal(invalidStore.ok, false);
  const invalidCount = await runRetentionPreview(current, { async previewBatch() { return { candidateCount: 999, lastId: null, hasMore: false }; } }, { async recordBatch() {}, async complete() {} }, checkpoint);
  assert.deepEqual(invalidCount, { ok: false, code: "preview_failed", message: "Preview returned an invalid bounded count.", checkpoint });
});
