import {
  advancePrivacyDeletionCheckpoint,
  type PrivacyDeletionCheckpoint,
  type PrivacyDeletionPlan,
  type PrivacyDeletionDataset,
} from "./privacy-deletion-plan.ts";

/**
 * The preview worker is intentionally read-only. Its adapter exposes only a
 * bounded preview operation; there is no delete method to accidentally call.
 */
export type PrivacyDeletionPreviewStore = {
  previewBatch(input: {
    requestId: string;
    workspaceId: string;
    dataset: PrivacyDeletionDataset;
    afterId: string | null;
    limit: number;
    signal?: AbortSignal;
  }): Promise<{ returnedCount: number; lastId: string | null; hasMore: boolean }>;
};

export type PrivacyDeletionAuditStore = {
  recordPreview(input: {
    requestId: string;
    workspaceId: string;
    dataset: PrivacyDeletionDataset;
    batchNumber: number;
    afterId: string | null;
    returnedCount: number;
    lastId: string | null;
    hasMore: boolean;
  }): Promise<void>;
};

export type PrivacyDeletionPreviewResult = {
  ok: true;
  batches: number;
  returnedCount: number;
  checkpoint: PrivacyDeletionCheckpoint;
  complete: boolean;
  aborted: boolean;
} | {
  ok: false;
  code: "invalid_plan" | "invalid_store" | "preview_failed" | "audit_failed";
  message: string;
  checkpoint: PrivacyDeletionCheckpoint;
};

const MAX_BATCHES_PER_RUN = 100;

/** Preview approved work without deleting, mutating, or exporting customer data. */
export async function runPrivacyDeletionPreview(
  plan: PrivacyDeletionPlan,
  store: PrivacyDeletionPreviewStore,
  audit: PrivacyDeletionAuditStore,
  checkpoint: PrivacyDeletionCheckpoint,
  options: { maxBatches?: number; signal?: AbortSignal } = {},
): Promise<PrivacyDeletionPreviewResult> {
  if (!plan || plan.dry_run !== true || plan.requires_operator_confirmation !== true) {
    return { ok: false, code: "invalid_plan", message: "Only an explicit dry-run plan can be previewed.", checkpoint };
  }
  if (!store || typeof store.previewBatch !== "function" || !audit || typeof audit.recordPreview !== "function") {
    return { ok: false, code: "invalid_store", message: "A read-only preview store and audit store are required.", checkpoint };
  }
  const maxBatches = typeof options.maxBatches === "number" && Number.isInteger(options.maxBatches)
    ? Math.min(MAX_BATCHES_PER_RUN, Math.max(1, options.maxBatches))
    : 10;
  let current = checkpoint;
  let batches = 0;
  let returnedCount = 0;
  while (current.dataset && batches < maxBatches) {
    if (options.signal?.aborted) return { ok: true, batches, returnedCount, checkpoint: current, complete: false, aborted: true };
    let preview: Awaited<ReturnType<PrivacyDeletionPreviewStore["previewBatch"]>>;
    try {
      preview = await store.previewBatch({
        requestId: plan.request_id,
        workspaceId: plan.workspace_id,
        dataset: current.dataset,
        afterId: current.after_id,
        limit: plan.batch_size,
        signal: options.signal,
      });
    } catch {
      return { ok: false, code: "preview_failed", message: "Unable to preview the deletion batch.", checkpoint: current };
    }
    if (!Number.isInteger(preview.returnedCount) || preview.returnedCount < 0 || preview.returnedCount > plan.batch_size) {
      return { ok: false, code: "preview_failed", message: "Preview returned an invalid bounded count.", checkpoint: current };
    }
    const advanced = advancePrivacyDeletionCheckpoint(plan, current, preview.returnedCount, preview.lastId, preview.hasMore);
    if (!advanced.ok) return { ok: false, code: "preview_failed", message: advanced.reason, checkpoint: current };
    try {
      await audit.recordPreview({ requestId: plan.request_id, workspaceId: plan.workspace_id, dataset: current.dataset, batchNumber: current.batch_number, afterId: current.after_id, returnedCount: preview.returnedCount, lastId: preview.lastId, hasMore: preview.hasMore });
    } catch {
      return { ok: false, code: "audit_failed", message: "Unable to record the preview audit result.", checkpoint: current };
    }
    returnedCount += preview.returnedCount;
    batches += 1;
    current = advanced.checkpoint;
  }
  return { ok: true, batches, returnedCount, checkpoint: current, complete: current.dataset === null, aborted: false };
}

export const PRIVACY_DELETION_PREVIEW_POLICY = {
  maxBatchesPerRun: MAX_BATCHES_PER_RUN,
  destructiveOperations: false,
  rawPayloadsRead: false,
  rawPayloadsWritten: false,
} as const;
