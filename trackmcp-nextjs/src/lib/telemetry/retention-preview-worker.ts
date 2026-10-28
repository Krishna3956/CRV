import {
  FOUNDER_OS_RETENTION_POLICY,
  FOUNDER_OS_RETENTION_POLICY_VERSION,
  getRetentionRule,
  retentionCutoff,
  type RetentionDataset,
  type RetentionRule,
} from "./retention-policy.ts";

/**
 * Retention is intentionally a two-step operational boundary. This module
 * can enumerate and audit candidates, but it never deletes rows. A reviewed
 * storage adapter and an operator-approved execution policy are required for
 * destructive cleanup.
 */
export const RETENTION_PREVIEW_VERSION = "2026-10-29.v1" as const;
export const RETENTION_PREVIEW_MAX_BATCH_SIZE = 500;
export const RETENTION_PREVIEW_MAX_BATCHES_PER_RUN = 100;

const REQUEST_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CURSOR_ID = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,191}$/;

export type RetentionPreviewPlan = {
  version: typeof RETENTION_PREVIEW_VERSION;
  policy_version: typeof FOUNDER_OS_RETENTION_POLICY_VERSION;
  request_id: string;
  workspace_id: string;
  as_of: string;
  batch_size: number;
  datasets: readonly RetentionDataset[];
  requires_operator_confirmation: true;
  dry_run: true;
};

export type RetentionPreviewCheckpoint = {
  dataset: RetentionDataset | null;
  after_id: string | null;
  batch_number: number;
};

export type RetentionPreviewBatch = {
  request_id: string;
  workspace_id: string;
  dataset: RetentionDataset;
  table: string;
  timestamp_column: string;
  cutoff: string;
  after_id: string | null;
  limit: number;
  batch_number: number;
  dry_run: true;
};

export type RetentionPreviewDecision =
  | { ok: true; plan: RetentionPreviewPlan }
  | { ok: false; code: "invalid_request" | "invalid_scope" | "invalid_time"; reason: string };

export type RetentionPreviewStore = {
  previewBatch(input: RetentionPreviewBatch & { signal?: AbortSignal }): Promise<{
    candidateCount: number;
    lastId: string | null;
    hasMore: boolean;
  }>;
};

export type RetentionPreviewAuditStore = {
  recordBatch(input: RetentionPreviewBatch & {
    candidateCount: number;
    lastId: string | null;
    hasMore: boolean;
  }): Promise<void>;
  complete(input: {
    requestId: string;
    workspaceId: string;
    policyVersion: typeof FOUNDER_OS_RETENTION_POLICY_VERSION;
    asOf: string;
  }): Promise<void>;
};

export type RetentionPreviewResult = {
  ok: true;
  batches: number;
  candidateCount: number;
  checkpoint: RetentionPreviewCheckpoint;
  complete: boolean;
  aborted: boolean;
} | {
  ok: false;
  code: "invalid_plan" | "invalid_checkpoint" | "invalid_store" | "preview_failed" | "audit_failed" | "completion_failed";
  message: string;
  checkpoint: RetentionPreviewCheckpoint;
};

const DATASETS = FOUNDER_OS_RETENTION_POLICY.map((rule) => rule.dataset) as readonly RetentionDataset[];

function validCheckpoint(checkpoint: RetentionPreviewCheckpoint): boolean {
  return Boolean(
    checkpoint &&
    (checkpoint.dataset === null || DATASETS.includes(checkpoint.dataset)) &&
    (checkpoint.after_id === null || CURSOR_ID.test(checkpoint.after_id)) &&
    Number.isInteger(checkpoint.batch_number) && checkpoint.batch_number >= 0 && checkpoint.batch_number <= 100_000,
  );
}

function validPlan(plan: RetentionPreviewPlan): boolean {
  return Boolean(
    plan &&
    plan.version === RETENTION_PREVIEW_VERSION &&
    plan.policy_version === FOUNDER_OS_RETENTION_POLICY_VERSION &&
    REQUEST_ID.test(plan.request_id) &&
    UUID.test(plan.workspace_id) &&
    Number.isFinite(Date.parse(plan.as_of)) &&
    Number.isInteger(plan.batch_size) && plan.batch_size >= 1 && plan.batch_size <= RETENTION_PREVIEW_MAX_BATCH_SIZE &&
    Array.isArray(plan.datasets) && plan.datasets.length === DATASETS.length &&
    plan.datasets.every((dataset, index) => dataset === DATASETS[index]) &&
    plan.requires_operator_confirmation === true && plan.dry_run === true,
  );
}

export function initialRetentionPreviewCheckpoint(): RetentionPreviewCheckpoint {
  return { dataset: DATASETS[0] ?? null, after_id: null, batch_number: 0 };
}

export function buildRetentionPreviewPlan(input: {
  requestId: unknown;
  workspaceId: unknown;
  batchSize?: unknown;
  asOf?: Date;
}): RetentionPreviewDecision {
  if (typeof input.requestId !== "string" || !REQUEST_ID.test(input.requestId)) {
    return { ok: false, code: "invalid_request", reason: "request_id is missing or malformed" };
  }
  if (typeof input.workspaceId !== "string" || !UUID.test(input.workspaceId)) {
    return { ok: false, code: "invalid_scope", reason: "a valid workspace scope is required" };
  }
  const asOf = input.asOf ?? new Date();
  if (!(asOf instanceof Date) || !Number.isFinite(asOf.getTime())) {
    return { ok: false, code: "invalid_time", reason: "as_of must be a valid timestamp" };
  }
  const requested = typeof input.batchSize === "number" && Number.isFinite(input.batchSize)
    ? Math.floor(input.batchSize)
    : RETENTION_PREVIEW_MAX_BATCH_SIZE;
  const batchSize = Math.min(RETENTION_PREVIEW_MAX_BATCH_SIZE, Math.max(1, requested));
  return {
    ok: true,
    plan: {
      version: RETENTION_PREVIEW_VERSION,
      policy_version: FOUNDER_OS_RETENTION_POLICY_VERSION,
      request_id: input.requestId,
      workspace_id: input.workspaceId,
      as_of: asOf.toISOString(),
      batch_size: batchSize,
      datasets: DATASETS,
      requires_operator_confirmation: true,
      dry_run: true,
    },
  };
}

export function nextRetentionPreviewBatch(
  plan: RetentionPreviewPlan,
  checkpoint: RetentionPreviewCheckpoint,
): RetentionPreviewBatch | null {
  if (!validPlan(plan) || !validCheckpoint(checkpoint) || checkpoint.dataset === null) return null;
  const rule: RetentionRule = getRetentionRule(checkpoint.dataset);
  return {
    request_id: plan.request_id,
    workspace_id: plan.workspace_id,
    dataset: checkpoint.dataset,
    table: rule.table,
    timestamp_column: rule.timestampColumn,
    cutoff: retentionCutoff(new Date(plan.as_of), checkpoint.dataset).toISOString(),
    after_id: checkpoint.after_id,
    limit: plan.batch_size,
    batch_number: checkpoint.batch_number,
    dry_run: true,
  };
}

export function advanceRetentionPreviewCheckpoint(
  checkpoint: RetentionPreviewCheckpoint,
  candidateCount: number,
  lastId: unknown,
  hasMore: boolean,
): { ok: true; checkpoint: RetentionPreviewCheckpoint } | { ok: false; reason: string } {
  if (!validCheckpoint(checkpoint)) return { ok: false, reason: "checkpoint is invalid" };
  if (!Number.isInteger(candidateCount) || candidateCount < 0 || candidateCount > RETENTION_PREVIEW_MAX_BATCH_SIZE) {
    return { ok: false, reason: "candidateCount exceeds the preview bound" };
  }
  if (hasMore && (typeof lastId !== "string" || !CURSOR_ID.test(lastId))) {
    return { ok: false, reason: "a bounded last_id is required when more rows remain" };
  }
  if (checkpoint.dataset === null) return { ok: false, reason: "a completed checkpoint cannot advance" };
  const index = DATASETS.indexOf(checkpoint.dataset);
  const nextDataset = hasMore ? checkpoint.dataset : DATASETS[index + 1] ?? null;
  return {
    ok: true,
    checkpoint: {
      dataset: nextDataset,
      after_id: hasMore ? lastId as string : null,
      batch_number: checkpoint.batch_number + 1,
    },
  };
}

/** Enumerate retention candidates without deleting, mutating, or exporting rows. */
export async function runRetentionPreview(
  plan: RetentionPreviewPlan,
  store: RetentionPreviewStore,
  audit: RetentionPreviewAuditStore,
  checkpoint: RetentionPreviewCheckpoint,
  options: { maxBatches?: number; signal?: AbortSignal } = {},
): Promise<RetentionPreviewResult> {
  if (!validPlan(plan)) return { ok: false, code: "invalid_plan", message: "Only the current, explicit dry-run retention plan can be previewed.", checkpoint };
  if (!validCheckpoint(checkpoint) || (checkpoint.dataset !== null && !plan.datasets.includes(checkpoint.dataset))) {
    return { ok: false, code: "invalid_checkpoint", message: "The retention checkpoint is outside the approved policy.", checkpoint };
  }
  if (!store || typeof store.previewBatch !== "function" || !audit || typeof audit.recordBatch !== "function" || typeof audit.complete !== "function") {
    return { ok: false, code: "invalid_store", message: "A bounded preview store and audit store are required.", checkpoint };
  }
  const maxBatches = typeof options.maxBatches === "number" && Number.isInteger(options.maxBatches)
    ? Math.min(RETENTION_PREVIEW_MAX_BATCHES_PER_RUN, Math.max(1, options.maxBatches))
    : 10;
  let current = checkpoint;
  let batches = 0;
  let candidateCount = 0;
  while (current.dataset && batches < maxBatches) {
    if (options.signal?.aborted) return { ok: true, batches, candidateCount, checkpoint: current, complete: false, aborted: true };
    const batch = nextRetentionPreviewBatch(plan, current);
    if (!batch) return { ok: false, code: "invalid_checkpoint", message: "Unable to construct a bounded retention preview batch.", checkpoint: current };
    let preview: Awaited<ReturnType<RetentionPreviewStore["previewBatch"]>>;
    try {
      preview = await store.previewBatch({ ...batch, signal: options.signal });
    } catch {
      return { ok: false, code: "preview_failed", message: "Unable to preview the retention batch.", checkpoint: current };
    }
    if (!Number.isInteger(preview.candidateCount) || preview.candidateCount < 0 || preview.candidateCount > batch.limit) {
      return { ok: false, code: "preview_failed", message: "Preview returned an invalid bounded count.", checkpoint: current };
    }
    const advanced = advanceRetentionPreviewCheckpoint(current, preview.candidateCount, preview.lastId, preview.hasMore);
    if (!advanced.ok) return { ok: false, code: "preview_failed", message: advanced.reason, checkpoint: current };
    try {
      await audit.recordBatch({ ...batch, candidateCount: preview.candidateCount, lastId: preview.lastId, hasMore: preview.hasMore });
    } catch {
      return { ok: false, code: "audit_failed", message: "Unable to record the retention preview audit result.", checkpoint: current };
    }
    candidateCount += preview.candidateCount;
    batches += 1;
    current = advanced.checkpoint;
  }
  if (current.dataset) return { ok: true, batches, candidateCount, checkpoint: current, complete: false, aborted: false };
  try {
    await audit.complete({ requestId: plan.request_id, workspaceId: plan.workspace_id, policyVersion: plan.policy_version, asOf: plan.as_of });
  } catch {
    return { ok: false, code: "completion_failed", message: "Retention preview completed but could not be finalized in the audit store.", checkpoint: current };
  }
  return { ok: true, batches, candidateCount, checkpoint: current, complete: true, aborted: false };
}

export const RETENTION_PREVIEW_POLICY = {
  maxBatchSize: RETENTION_PREVIEW_MAX_BATCH_SIZE,
  maxBatchesPerRun: RETENTION_PREVIEW_MAX_BATCHES_PER_RUN,
  destructiveOperations: false,
  rawPayloadsRead: false,
  rawPayloadsWritten: false,
  requiresSeparateExecutionAdapter: true,
} as const;
