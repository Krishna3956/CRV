import test from "node:test";
import assert from "node:assert/strict";
import {
  buildPrivacyDeletionPlan,
  canExecutePrivacyDeletionPlan,
  initialPrivacyDeletionCheckpoint,
  advancePrivacyDeletionCheckpoint,
  PRIVACY_DELETION_MAX_BATCH_SIZE,
} from "./privacy-deletion-plan.ts";

const workspaceId = "11111111-1111-4111-8111-111111111111";

test("deletion planning requires an approved request and workspace scope", () => {
  assert.equal(buildPrivacyDeletionPlan({ requestId: "r1", workspaceId, status: "requested" }).ok, false);
  assert.equal(buildPrivacyDeletionPlan({ requestId: "r1", workspaceId: null, status: "approved" }).ok, false);
  const result = buildPrivacyDeletionPlan({ requestId: "r1", workspaceId, status: "approved" });
  assert.equal(result.ok, true);
});

test("plans are bounded, workspace-scoped, and explicitly dry-run", () => {
  const result = buildPrivacyDeletionPlan({ requestId: "r1", workspaceId, status: "processing", batchSize: 99999 });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.plan.workspace_id, workspaceId);
    assert.equal(result.plan.batch_size, PRIVACY_DELETION_MAX_BATCH_SIZE);
    assert.equal(result.plan.dry_run, true);
    assert.equal(result.plan.requires_operator_confirmation, true);
    assert.equal("api_key" in result.plan, false);
  }
});

test("execution remains closed while the only plan type is dry-run", () => {
  const result = buildPrivacyDeletionPlan({ requestId: "r1", workspaceId, status: "approved" });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(canExecutePrivacyDeletionPlan(result.plan, false), false);
    assert.equal(canExecutePrivacyDeletionPlan(result.plan, true), false);
  }
});

test("deletion checkpoints advance deterministically and resume by bounded id", () => {
  const result = buildPrivacyDeletionPlan({ requestId: "r1", workspaceId, status: "approved", batchSize: 2 });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const first = initialPrivacyDeletionCheckpoint();
  const next = advancePrivacyDeletionCheckpoint(result.plan, first, 2, "event-2", true);
  assert.equal(next.ok, true);
  if (!next.ok) return;
  assert.equal(next.checkpoint.dataset, "events");
  assert.equal(next.checkpoint.after_id, "event-2");
  const finishedDataset = advancePrivacyDeletionCheckpoint(result.plan, next.checkpoint, 1, null, false);
  assert.equal(finishedDataset.ok, true);
  if (finishedDataset.ok) assert.equal(finishedDataset.next_batch?.dataset, "semantic_facts");
});

test("deletion checkpoint rejects unbounded or unknown cursors", () => {
  const result = buildPrivacyDeletionPlan({ requestId: "r1", workspaceId, status: "approved" });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const checkpoint = initialPrivacyDeletionCheckpoint();
  assert.equal(advancePrivacyDeletionCheckpoint(result.plan, checkpoint, 501, "x", true).ok, false);
  assert.equal(advancePrivacyDeletionCheckpoint(result.plan, checkpoint, 1, "bad cursor with spaces", true).ok, false);
});
