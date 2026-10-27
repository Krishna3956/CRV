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
  rpc?: (name: "trackmcp_enqueue_refresh_jobs", args: { p_workspace_id: string; p_window: number; p_requested_at: string }) => PromiseLike<EnqueueResult>;
};

/** Build a small, idempotent batch of worker requests. The queue has no raw
 * event payload, key, identifier, or customer data—only workspace, bounded
 * job kind, and a 15-minute UTC ingest window. The reviewed production RPC
 * requeues a terminal window job when a later batch arrives, so a fingerprint
 * is not needed to create another redundant projection scan. */
export function refreshBatchFingerprint(eventIds: readonly string[]): string {
  return createHash("sha256").update([...new Set(eventIds.filter((eventId) => typeof eventId === "string" && eventId.length > 0))].sort().join("\n")).digest("hex");
}

export function buildTrackMCPRefreshEnqueueRows(workspaceId: string, now = new Date(), batchFingerprint = "window"): TrackMCPRefreshEnqueueRow[] {
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(workspaceId) || !Number.isFinite(now.getTime())) return [];
  if (!/^(?:window|[a-f0-9]{64})$/i.test(batchFingerprint)) return [];
  const window = Math.floor(now.getTime() / WINDOW_MS);
  return TRACKMCP_INGEST_REFRESH_KINDS.slice(0, MAX_ENQUEUED_KINDS).map((kind) => ({
    workspace_id: workspaceId,
    kind,
    dedupe_key: `ingest-window:${window}:${kind}`,
  }));
}

function buildLegacyRefreshEnqueueRows(workspaceId: string, now: Date, batchFingerprint: string): TrackMCPRefreshEnqueueRow[] {
  const rows = buildTrackMCPRefreshEnqueueRows(workspaceId, now, batchFingerprint);
  if (!rows.length || batchFingerprint === "window") return rows;
  const window = Math.floor(now.getTime() / WINDOW_MS);
  return rows.map((row) => ({ ...row, dedupe_key: `ingest-window:${window}:${batchFingerprint}:${row.kind}` }));
}

function rpcMissing(error: { code?: string; message: string } | null): boolean {
  return Boolean(error && (error.code === "PGRST202" || /function .*trackmcp_enqueue_refresh_jobs.*does not exist/i.test(error.message)));
}

/** Best-effort enqueue boundary. Ingest acceptance is never rolled back just
 * because an optional derived projection migration/queue is unavailable. */
export async function enqueueTrackMCPRefreshJobs(client: RefreshEnqueueClient, workspaceId: string, now = new Date(), batchFingerprint = "window") {
  const rows = buildTrackMCPRefreshEnqueueRows(workspaceId, now, batchFingerprint);
  if (!rows.length) return { attempted: 0, error: null };
  const window = Math.floor(now.getTime() / WINDOW_MS);
  if (typeof client.rpc === "function") {
    const result = await client.rpc("trackmcp_enqueue_refresh_jobs", {
      p_workspace_id: workspaceId,
      p_window: window,
      p_requested_at: now.toISOString(),
    });
    if (!result.error || !rpcMissing(result.error)) return { attempted: rows.length, error: result.error };
  }
  // Keep older deployments safe until the coalescing migration is applied:
  // they retain the fingerprinted fallback rather than silently skipping a
  // later batch after a terminal window job.
  const legacyRows = buildLegacyRefreshEnqueueRows(workspaceId, now, batchFingerprint);
  const result = await client.from("trackmcp_refresh_jobs").upsert(legacyRows, {
    onConflict: "workspace_id,kind,dedupe_key",
    ignoreDuplicates: true,
  });
  return { attempted: legacyRows.length, error: result.error };
}
