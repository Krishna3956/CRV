import type { RefreshJobClaimStore } from "./refresh-worker.ts";
import type { TrackMCPRefreshJob } from "./refresh-jobs.ts";

type RpcResult<T> = { data: T | null; error: { code?: string; message: string } | null };
type RefreshRpcClient = {
  rpc(name: string, args: Record<string, unknown>): PromiseLike<RpcResult<unknown>>;
};

function firstRow(value: unknown): TrackMCPRefreshJob | null {
  if (!Array.isArray(value) || !value.length || !value[0] || typeof value[0] !== "object") return null;
  return value[0] as TrackMCPRefreshJob;
}

/**
 * Supabase service-role adapter for the pure refresh worker. The RPCs perform
 * the row lock and lease predicate in Postgres; this adapter never performs a
 * select-then-update claim from application code.
 */
export function createSupabaseRefreshJobStore(client: RefreshRpcClient): RefreshJobClaimStore {
  return {
    async claimNext({ owner, leaseMs, now }) {
      void now;
      const result = await client.rpc("trackmcp_claim_refresh_job", {
        p_owner: owner,
        p_lease_seconds: Math.round(leaseMs / 1000),
      });
      if (result.error) throw new Error(result.error.message);
      return firstRow(result.data);
    },
    async saveResult({ previous, next }) {
      // A claimed job can only return to `queued` when its bounded handler
      // deadline was reached. Preserve that explicit deferred outcome in the
      // RPC instead of manufacturing a retryable failure and backoff entry.
      const outcome = next.state === "succeeded" ? "succeeded" : next.state === "failed" ? "failed" : next.state === "queued" ? "deferred" : "retryable";
      const result = await client.rpc("trackmcp_record_refresh_job_result", {
        p_id: previous.id,
        p_owner: previous.lease_owner,
        p_outcome: outcome,
        p_error_code: next.last_error_code,
        p_error_detail: next.last_error_detail,
      });
      if (result.error) throw new Error(result.error.message);
      if (!firstRow(result.data)) throw new Error("Refresh job lease was lost before result persistence.");
    },
  };
}
