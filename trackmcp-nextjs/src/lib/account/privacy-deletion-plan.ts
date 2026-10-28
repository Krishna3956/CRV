import type { PrivacyRequestStatus } from "./privacy-request.ts";

/**
 * Review-only deletion boundary. This module creates an explicit plan; it
 * never connects to a database and never performs a destructive operation.
 */
export const PRIVACY_DELETION_PLAN_VERSION = "2026-10-19.v2";
export const PRIVACY_DELETION_MAX_BATCH_SIZE = 500;

export const PRIVACY_DELETION_DATASETS = [
  "events",
  "semantic_facts",
  "action_queue",
  "refresh_jobs",
  "activation_milestones",
  "catalog_versions",
  "catalog_entity_reads",
] as const;
export type PrivacyDeletionDataset = (typeof PRIVACY_DELETION_DATASETS)[number];

export type PrivacyDeletionPlan = {
  version: string;
  request_id: string;
  workspace_id: string;
  status: "approved" | "processing";
  batch_size: number;
  datasets: readonly PrivacyDeletionDataset[];
  requires_operator_confirmation: true;
  dry_run: true;
};

export type PrivacyDeletionCheckpoint = {
  dataset: PrivacyDeletionDataset | null;
  after_id: string | null;
  batch_number: number;
};

export type PrivacyDeletionBatch = {
  request_id: string;
  workspace_id: string;
  dataset: PrivacyDeletionDataset;
  after_id: string | null;
  limit: number;
  batch_number: number;
  dry_run: true;
};

const CHECKPOINT_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;

/** Start a deterministic, resumable sequence without touching a database. */
export function initialPrivacyDeletionCheckpoint(): PrivacyDeletionCheckpoint {
  return { dataset: PRIVACY_DELETION_DATASETS[0], after_id: null, batch_number: 0 };
}

/** Advance a reviewed dry-run checkpoint; this function never deletes rows. */
export function advancePrivacyDeletionCheckpoint(
  plan: Pick<PrivacyDeletionPlan, "request_id" | "workspace_id" | "batch_size">,
  checkpoint: PrivacyDeletionCheckpoint,
  returnedCount: number,
  lastId: unknown,
  hasMore: boolean,
): { ok: true; checkpoint: PrivacyDeletionCheckpoint; next_batch: PrivacyDeletionBatch | null } | { ok: false; reason: string } {
  if (!Number.isInteger(returnedCount) || returnedCount < 0 || returnedCount > plan.batch_size) return { ok: false, reason: "returnedCount exceeds the plan bound" };
  if (checkpoint.batch_number < 0 || checkpoint.batch_number > 100_000) return { ok: false, reason: "checkpoint batch number is out of bounds" };
  if (checkpoint.dataset !== null && !PRIVACY_DELETION_DATASETS.includes(checkpoint.dataset)) return { ok: false, reason: "checkpoint dataset is not in the plan" };
  if (hasMore && (typeof lastId !== "string" || !CHECKPOINT_ID.test(lastId))) return { ok: false, reason: "a bounded last_id is required when more rows remain" };
  const currentIndex = checkpoint.dataset === null ? PRIVACY_DELETION_DATASETS.length : PRIVACY_DELETION_DATASETS.indexOf(checkpoint.dataset);
  const nextIndex = hasMore ? currentIndex : currentIndex + 1;
  const nextDataset = PRIVACY_DELETION_DATASETS[nextIndex] ?? null;
  const nextCheckpoint: PrivacyDeletionCheckpoint = { dataset: nextDataset, after_id: hasMore ? lastId as string : null, batch_number: checkpoint.batch_number + 1 };
  return { ok: true, checkpoint: nextCheckpoint, next_batch: nextDataset ? { request_id: plan.request_id, workspace_id: plan.workspace_id, dataset: nextDataset, after_id: nextCheckpoint.after_id, limit: plan.batch_size, batch_number: nextCheckpoint.batch_number, dry_run: true } : null };
}

export type PrivacyDeletionDecision =
  | { ok: true; plan: PrivacyDeletionPlan }
  | { ok: false; code: "invalid_request" | "not_approved" | "invalid_scope"; reason: string };

const REQUEST_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function buildPrivacyDeletionPlan(input: {
  requestId: unknown;
  workspaceId: unknown;
  status: PrivacyRequestStatus;
  batchSize?: unknown;
}): PrivacyDeletionDecision {
  if (typeof input.requestId !== "string" || !REQUEST_ID.test(input.requestId)) {
    return { ok: false, code: "invalid_request", reason: "request_id is missing or malformed" };
  }
  if (typeof input.workspaceId !== "string" || !UUID.test(input.workspaceId)) {
    return { ok: false, code: "invalid_scope", reason: "a valid workspace scope is required" };
  }
  if (input.status !== "approved" && input.status !== "processing") {
    return { ok: false, code: "not_approved", reason: "only approved or processing requests may be planned" };
  }

  const requested = typeof input.batchSize === "number" && Number.isFinite(input.batchSize)
    ? Math.floor(input.batchSize)
    : PRIVACY_DELETION_MAX_BATCH_SIZE;
  const batchSize = Math.min(PRIVACY_DELETION_MAX_BATCH_SIZE, Math.max(1, requested));

  return {
    ok: true,
    plan: {
      version: PRIVACY_DELETION_PLAN_VERSION,
      request_id: input.requestId,
      workspace_id: input.workspaceId,
      status: input.status,
      batch_size: batchSize,
      datasets: PRIVACY_DELETION_DATASETS,
      requires_operator_confirmation: true,
      dry_run: true,
    },
  };
}

/**
 * Dry-run plans are intentionally not executable. Keep this guard explicit so
 * a future destructive adapter cannot accidentally treat operator confirmation
 * as permission to execute a plan that was only meant for review.
 */
export function canExecutePrivacyDeletionPlan(plan: PrivacyDeletionPlan, confirmation: unknown): boolean {
  void plan;
  void confirmation;
  return false;
}
