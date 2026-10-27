import { createHash } from "node:crypto";
import type { TrackMCPRefreshJobKind } from "./refresh-jobs.ts";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ENQUEUED_KINDS = 4;

/** Derived projections that are safe to request after accepted server telemetry.
 * Retention cleanup is deliberately excluded: it needs its own approved plan. */
export const TRACKMCP_INGEST_REFRESH_KINDS = [
  "fact_projection",
  "action_queue_refresh",
  "catalog_recompute",
  "catalog_entity_recompute",
] as const satisfies readonly TrackMCPRefreshJobKind[];

export type TrackMCPRefreshEnqueueRow = {
  workspace_id: string;
  kind: (typeof TRACKMCP_INGEST_REFRESH_KINDS)[number];
  dedupe_key: string;
};

type EnqueueResult = { error: { code?: string; message: string } | null };
export type RefreshEnqueueClient = {
  from(table: "trackmcp_refresh_jobs"): {
    upsert(rows: TrackMCPRefreshEnqueueRow[], options: { onConflict: string; ignoreDuplicates: boolean }): PromiseLike<EnqueueResult>;
  };
};

/** Build a small, idempotent batch of worker requests. The queue has no raw
 * event payload, key, identifier, or customer data—only workspace, bounded
 * job kind, a 15-minute UTC ingest window, and a SHA-256 batch fingerprint.
 * Projection handlers read that window directly while the fingerprint keeps a
 * later batch in the same window from being hidden behind a terminal job. */
export function refreshBatchFingerprint(eventIds: readonly string[]): string {
  return createHash("sha256").update([...new Set(eventIds.filter((eventId) => typeof eventId === "string" && eventId.length > 0))].sort().join("\n")).digest("hex");
}

export function buildTrackMCPRefreshEnqueueRows(workspaceId: string, now = new Date(), batchFingerprint = "window"): TrackMCPRefreshEnqueueRow[] {
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(workspaceId) || !Number.isFinite(now.getTime())) return [];
  if (!/^(?:window|[a-f0-9]{64})$/i.test(batchFingerprint)) return [];
  const window = Math.floor(now.getTime() / WINDOW_MS);
  // Include the bounded ingest-batch fingerprint in the conflict key. A
  // window-only key can already be terminal when a later ingest arrives in
  // the same 15-minute window, silently skipping its derived projections.
  // Keep the legacy "window" sentinel compact for manual jobs; production
  // ingest always supplies the SHA-256 fingerprint.
  const fingerprintSuffix = batchFingerprint === "window" ? "" : `:${batchFingerprint}`;
  return TRACKMCP_INGEST_REFRESH_KINDS.slice(0, MAX_ENQUEUED_KINDS).map((kind) => ({
    workspace_id: workspaceId,
    kind,
    dedupe_key: `ingest-window:${window}${fingerprintSuffix}:${kind}`,
  }));
}

/** Best-effort enqueue boundary. Ingest acceptance is never rolled back just
 * because an optional derived projection migration/queue is unavailable. */
export async function enqueueTrackMCPRefreshJobs(client: RefreshEnqueueClient, workspaceId: string, now = new Date(), batchFingerprint = "window") {
  const rows = buildTrackMCPRefreshEnqueueRows(workspaceId, now, batchFingerprint);
  if (!rows.length) return { attempted: 0, error: null };
  const result = await client.from("trackmcp_refresh_jobs").upsert(rows, {
    onConflict: "workspace_id,kind,dedupe_key",
    ignoreDuplicates: true,
  });
  return { attempted: rows.length, error: result.error };
}
