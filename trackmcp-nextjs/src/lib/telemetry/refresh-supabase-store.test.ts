import test from "node:test";
import assert from "node:assert/strict";
import { createSupabaseRefreshJobStore } from "./refresh-supabase-store.ts";
import { createRefreshJob, claimRefreshJob } from "./refresh-jobs.ts";

const now = new Date("2026-10-18T00:00:00.000Z");
const fixture = (() => {
  const created = createRefreshJob({ id: "job-1", workspace_id: "ws-1", kind: "fact_projection", dedupe_key: "window-1", now });
  assert.equal(created.ok, true);
  if (!created.ok) throw new Error("fixture failed");
  const claimed = claimRefreshJob(created.job, "worker-a", now, 60_000);
  assert.equal(claimed.ok, true);
  if (!claimed.ok) throw new Error("claim fixture failed");
  return claimed.job;
})();

test("Supabase refresh adapter calls only the lease-fenced RPC contract", async () => {
  const calls: Array<{ name: string; args: Record<string, unknown> }> = [];
  const store = createSupabaseRefreshJobStore({
    async rpc(name, args) {
      calls.push({ name, args });
      if (name === "trackmcp_claim_refresh_job") return { data: [fixture], error: null };
      return { data: [fixture], error: null };
    },
  });
  const claimed = await store.claimNext({ owner: "worker-a", now, leaseMs: 60_000 });
  assert.equal(claimed?.id, "job-1");
  await store.saveResult({ previous: fixture, next: { ...fixture, state: "succeeded" } });
  assert.deepEqual(calls, [
    { name: "trackmcp_claim_refresh_job", args: { p_owner: "worker-a", p_lease_seconds: 60 } },
    { name: "trackmcp_record_refresh_job_result", args: { p_id: "job-1", p_owner: "worker-a", p_outcome: "succeeded", p_error_code: null, p_error_detail: null } },
  ]);
});
