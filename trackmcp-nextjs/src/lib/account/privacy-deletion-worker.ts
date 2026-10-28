import {
  advancePrivacyDeletionCheckpoint,
  PRIVACY_DELETION_DATASETS,
  type PrivacyDeletionCheckpoint,
  type PrivacyDeletionDataset,
} from "./privacy-deletion-plan.ts";
import { evaluatePrivacyLegalHold, type PrivacyLegalHoldInput } from "./privacy-legal-hold.ts";

/**
 * Destructive deletion is an operator-controlled capability. The worker is
 * deliberately separate from the review-only preview worker so a preview plan
 * can never be passed to a destructive adapter by accident.
 */
export const PRIVACY_DELETION_EXECUTION_VERSION = "2026-10-29.v1";
export const PRIVACY_DELETION_EXECUTION_CONFIRMATION_PREFIX = "DELETE_WORKSPACE";
const OPERATOR_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const REQUEST_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_BATCHES_PER_RUN = 100;

export type PrivacyDeletionExecutionPlan = {
  version: typeof PRIVACY_DELETION_EXECUTION_VERSION;
  request_id: string;
  workspace_id: string;
  status: "processing";
  batch_size: number;
  datasets: readonly PrivacyDeletionDataset[];
  requires_operator_confirmation: true;
  dry_run: false;
  operator_id: string;
  second_approver_id: string;
  legal_hold: PrivacyLegalHoldInput;
};

export type PrivacyDeletionExecutionStore = {
  /**
   * Delete one bounded, workspace-scoped batch. The adapter must use
   * (request_id, dataset, batch_number) as an idempotency key and return the
   * same result when a completed batch is retried.
   */
  deleteBatch(input: {
    requestId: string;
    workspaceId: string;
    dataset: PrivacyDeletionDataset;
    batchNumber: number;
    afterId: string | null;
    limit: number;
    signal?: AbortSignal;
  }): Promise<{ affectedCount: number; lastId: string | null; hasMore: boolean }>;
  recordBatch(input: {
    requestId: string;
    workspaceId: string;
    dataset: PrivacyDeletionDataset;
    batchNumber: number;
    afterId: string | null;
    affectedCount: number;
    lastId: string | null;
    hasMore: boolean;
    operatorId: string;
    secondApproverId: string;
  }): Promise<void>;
  completeRequest(input: {
    requestId: string;
    workspaceId: string;
    operatorId: string;
    secondApproverId: string;
  }): Promise<void>;
};

export type PrivacyDeletionExecutionResult = {
  ok: true;
  batches: number;
  affectedCount: number;
  checkpoint: PrivacyDeletionCheckpoint;
  complete: boolean;
  aborted: boolean;
} | {
  ok: false;
  code: "disabled" | "invalid_plan" | "invalid_confirmation" | "blocked" | "invalid_store" | "delete_failed" | "audit_failed" | "completion_failed";
  message: string;
  checkpoint: PrivacyDeletionCheckpoint;
};

export const PRIVACY_DELETION_EXECUTION_POLICY = {
  enabledByDefault: false,
  maxBatchesPerRun: MAX_BATCHES_PER_RUN,
  requiresDistinctApprovers: true,
  requiresClearedLegalHold: true,
  rawPayloadsRead: false,
  rawPayloadsWritten: false,
} as const;

export function buildPrivacyDeletionConfirmation(requestId: string, version = PRIVACY_DELETION_EXECUTION_VERSION): string {
  return `${PRIVACY_DELETION_EXECUTION_CONFIRMATION_PREFIX}:${requestId}:${version}`;
}

function validPlan(plan: PrivacyDeletionExecutionPlan): boolean {
  return Boolean(
    plan &&
    plan.version === PRIVACY_DELETION_EXECUTION_VERSION &&
    typeof plan.request_id === "string" && REQUEST_ID.test(plan.request_id) &&
    typeof plan.workspace_id === "string" && UUID.test(plan.workspace_id) &&
    plan.status === "processing" && plan.dry_run === false &&
    plan.requires_operator_confirmation === true &&
    Number.isInteger(plan.batch_size) && plan.batch_size >= 1 && plan.batch_size <= 500 &&
    Array.isArray(plan.datasets) && plan.datasets.length === PRIVACY_DELETION_DATASETS.length &&
    plan.datasets.every((dataset, index) => dataset === PRIVACY_DELETION_DATASETS[index]) &&
    typeof plan.operator_id === "string" && OPERATOR_ID.test(plan.operator_id) &&
    typeof plan.second_approver_id === "string" && OPERATOR_ID.test(plan.second_approver_id) &&
    plan.operator_id !== plan.second_approver_id
  );
}

/**
 * Execute an explicitly approved plan in bounded, resumable, idempotent
 * slices. The adapter remains responsible for a transactionally scoped delete
 * and must never accept a workspace or dataset from outside this plan.
 */
export async function runPrivacyDeletion(
  plan: PrivacyDeletionExecutionPlan,
  store: PrivacyDeletionExecutionStore,
  confirmation: unknown,
  checkpoint: PrivacyDeletionCheckpoint,
  options: { enabled?: boolean; maxBatches?: number; signal?: AbortSignal } = {},
): Promise<PrivacyDeletionExecutionResult> {
  if (options.enabled !== true) return { ok: false, code: "disabled", message: "Destructive privacy deletion is disabled until the release policy enables it.", checkpoint };
  if (!validPlan(plan)) return { ok: false, code: "invalid_plan", message: "The deletion plan is not an approved processing plan.", checkpoint };
  if (confirmation !== buildPrivacyDeletionConfirmation(plan.request_id, plan.version)) {
    return { ok: false, code: "invalid_confirmation", message: "The explicit deletion confirmation does not match this request.", checkpoint };
  }
  const hold = evaluatePrivacyLegalHold(plan.legal_hold);
  if (!hold.eligible) return { ok: false, code: "blocked", message: `Deletion is blocked by policy: ${hold.blockers.join(",")}.`, checkpoint };
  if (!store || typeof store.deleteBatch !== "function" || typeof store.recordBatch !== "function" || typeof store.completeRequest !== "function") {
    return { ok: false, code: "invalid_store", message: "A bounded deletion adapter and audit store are required.", checkpoint };
  }
  if (!checkpoint || (checkpoint.dataset !== null && !plan.datasets.includes(checkpoint.dataset))) {
    return { ok: false, code: "invalid_plan", message: "The checkpoint is outside the approved dataset plan.", checkpoint };
  }
  const maxBatches = typeof options.maxBatches === "number" && Number.isInteger(options.maxBatches)
    ? Math.min(MAX_BATCHES_PER_RUN, Math.max(1, options.maxBatches))
    : 10;
  let current = checkpoint;
  let batches = 0;
  let affectedCount = 0;
  while (current.dataset && batches < maxBatches) {
    if (options.signal?.aborted) return { ok: true, batches, affectedCount, checkpoint: current, complete: false, aborted: true };
    let deleted: Awaited<ReturnType<PrivacyDeletionExecutionStore["deleteBatch"]>>;
    try {
      deleted = await store.deleteBatch({ requestId: plan.request_id, workspaceId: plan.workspace_id, dataset: current.dataset, batchNumber: current.batch_number, afterId: current.after_id, limit: plan.batch_size, signal: options.signal });
    } catch {
      return { ok: false, code: "delete_failed", message: "Unable to execute the bounded deletion batch.", checkpoint: current };
    }
    if (!Number.isInteger(deleted.affectedCount) || deleted.affectedCount < 0 || deleted.affectedCount > plan.batch_size) {
      return { ok: false, code: "delete_failed", message: "The deletion adapter returned an invalid bounded count.", checkpoint: current };
    }
    const advanced = advancePrivacyDeletionCheckpoint({ request_id: plan.request_id, workspace_id: plan.workspace_id, batch_size: plan.batch_size }, current, deleted.affectedCount, deleted.lastId, deleted.hasMore);
    if (!advanced.ok) return { ok: false, code: "delete_failed", message: advanced.reason, checkpoint: current };
    try {
      await store.recordBatch({ requestId: plan.request_id, workspaceId: plan.workspace_id, dataset: current.dataset, batchNumber: current.batch_number, afterId: current.after_id, affectedCount: deleted.affectedCount, lastId: deleted.lastId, hasMore: deleted.hasMore, operatorId: plan.operator_id, secondApproverId: plan.second_approver_id });
    } catch {
      return { ok: false, code: "audit_failed", message: "The deletion audit record could not be persisted.", checkpoint: current };
    }
    affectedCount += deleted.affectedCount;
    batches += 1;
    current = advanced.checkpoint;
  }
  if (current.dataset) return { ok: true, batches, affectedCount, checkpoint: current, complete: false, aborted: false };
  try {
    await store.completeRequest({ requestId: plan.request_id, workspaceId: plan.workspace_id, operatorId: plan.operator_id, secondApproverId: plan.second_approver_id });
  } catch {
    return { ok: false, code: "completion_failed", message: "Data deletion completed but the request status could not be finalized.", checkpoint: current };
  }
  return { ok: true, batches, affectedCount, checkpoint: current, complete: true, aborted: false };
}
