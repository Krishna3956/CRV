import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPrivacyDeletionConfirmation,
  PRIVACY_DELETION_EXECUTION_POLICY,
  PRIVACY_DELETION_EXECUTION_VERSION,
  runPrivacyDeletion,
  type PrivacyDeletionExecutionPlan,
} from "./privacy-deletion-worker.ts";
import { initialPrivacyDeletionCheckpoint } from "./privacy-deletion-plan.ts";

const workspaceId = "11111111-1111-4111-8111-111111111111";

function plan(overrides: Partial<PrivacyDeletionExecutionPlan> = {}): PrivacyDeletionExecutionPlan {
  return {
    version: PRIVACY_DELETION_EXECUTION_VERSION,
    request_id: "privacy-request-1",
    workspace_id: workspaceId,
    status: "processing",
    batch_size: 2,
    datasets: ["events", "semantic_facts", "action_queue", "refresh_jobs", "activation_milestones", "catalog_versions", "catalog_entity_reads"],
    requires_operator_confirmation: true,
    dry_run: false,
    operator_id: "operator-1",
    second_approver_id: "operator-2",
    legal_hold: { request_scope: "workspace", legal_hold: "clear", retention_exception: "none", dependency_review: "clear", second_approver_id: "operator-2" },
    ...overrides,
  };
}

function store() {
  const calls: Array<Record<string, unknown>> = [];
  return {
    calls,
    async deleteBatch(input: Record<string, unknown>) {
      calls.push(input);
      const batchNumber = input.batchNumber as number;
      return batchNumber === 0
        ? { affectedCount: 2, lastId: "row-1", hasMore: true }
        : { affectedCount: 0, lastId: null, hasMore: false };
    },
    async recordBatch() {},
    async completeRequest() {},
  };
}

test("execution is disabled unless the explicit release policy enables it", async () => {
  const adapter = store();
  const result = await runPrivacyDeletion(plan(), adapter, buildPrivacyDeletionConfirmation("privacy-request-1"), initialPrivacyDeletionCheckpoint());
  assert.equal(result.ok, false);
  assert.equal(result.code, "disabled");
  assert.equal(adapter.calls.length, 0);
  assert.equal(PRIVACY_DELETION_EXECUTION_POLICY.enabledByDefault, false);
});

test("execution requires the exact request-bound confirmation", async () => {
  const result = await runPrivacyDeletion(plan(), store(), "DELETE_WORKSPACE:other:v1", initialPrivacyDeletionCheckpoint(), { enabled: true });
  assert.equal(result.ok, false);
  assert.equal(result.code, "invalid_confirmation");
});

test("execution blocks uncleared holds and identical approvers", async () => {
  const held = await runPrivacyDeletion(plan({ legal_hold: { request_scope: "workspace", legal_hold: "active", retention_exception: "none", dependency_review: "clear", second_approver_id: "operator-2" } }), store(), buildPrivacyDeletionConfirmation("privacy-request-1"), initialPrivacyDeletionCheckpoint(), { enabled: true });
  assert.equal(held.ok, false);
  assert.equal(held.code, "blocked");
  const sameApprover = await runPrivacyDeletion(plan({ second_approver_id: "operator-1", legal_hold: { request_scope: "workspace", legal_hold: "clear", retention_exception: "none", dependency_review: "clear", second_approver_id: "operator-1" } }), store(), buildPrivacyDeletionConfirmation("privacy-request-1"), initialPrivacyDeletionCheckpoint(), { enabled: true });
  assert.equal(sameApprover.ok, false);
  assert.equal(sameApprover.code, "invalid_plan");
});

test("execution is bounded, resumable, and completes every approved dataset", async () => {
  const adapter = store();
  const result = await runPrivacyDeletion(plan(), adapter, buildPrivacyDeletionConfirmation("privacy-request-1"), initialPrivacyDeletionCheckpoint(), { enabled: true, maxBatches: 100 });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.complete, true);
    assert.equal(result.affectedCount, 2);
    assert.equal(result.checkpoint.dataset, null);
    assert.equal(result.batches, 8);
  }
  assert.equal(adapter.calls[0]?.dataset, "events");
  assert.equal(adapter.calls[1]?.afterId, "row-1");
  assert.equal(adapter.calls.at(-1)?.dataset, "catalog_entity_reads");
});

test("execution stops before another destructive call when aborted", async () => {
  const controller = new AbortController();
  controller.abort();
  const adapter = store();
  const result = await runPrivacyDeletion(plan(), adapter, buildPrivacyDeletionConfirmation("privacy-request-1"), initialPrivacyDeletionCheckpoint(), { enabled: true, signal: controller.signal });
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.aborted, true);
  assert.equal(adapter.calls.length, 0);
});

test("execution refuses an adapter that cannot provide an audit trail", async () => {
  const result = await runPrivacyDeletion(plan(), { deleteBatch: async () => ({ affectedCount: 0, lastId: null, hasMore: false }) } as never, buildPrivacyDeletionConfirmation("privacy-request-1"), initialPrivacyDeletionCheckpoint(), { enabled: true });
  assert.equal(result.ok, false);
  assert.equal(result.code, "invalid_store");
});
