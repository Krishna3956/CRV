import test from "node:test";
import assert from "node:assert/strict";
import { claimRefreshJob, createRefreshJob, recordRefreshJobResult, recordRefreshJobResultForOwner, refreshJobBackoffMs } from "./refresh-jobs.ts";

const now = new Date("2026-10-18T00:00:00.000Z");
function job() {
  const result = createRefreshJob({ id: "job-1", workspace_id: "ws-1", kind: "action_queue_refresh", dedupe_key: "window:2026-10-18", now });
  assert.equal(result.ok, true);
  if (!result.ok) throw new Error("fixture");
  return result.job;
}

test("creates bounded, deduplicable refresh work", () => {
  const result = createRefreshJob({ id: "job-1", workspace_id: "ws-1", kind: "catalog_recompute", dedupe_key: "snapshot:1", now });
  assert.equal(result.ok, true);
  if (result.ok) assert.deepEqual({ state: result.job.state, attempt_count: result.job.attempt_count, available_at: result.job.available_at }, { state: "queued", attempt_count: 0, available_at: now.toISOString() });
  assert.equal(createRefreshJob({ id: "x\ny", workspace_id: "ws-1", kind: "catalog_recompute", dedupe_key: "a", now }).ok, false);
});

test("claims due work and prevents a second worker from stealing an active lease", () => {
  const claimed = claimRefreshJob(job(), "worker-a", now);
  assert.equal(claimed.ok, true);
  if (!claimed.ok) throw new Error("claim");
  assert.equal(claimed.job.attempt_count, 1);
  const stolen = claimRefreshJob(claimed.job, "worker-b", new Date("2026-10-18T00:01:00.000Z"));
  assert.equal(stolen.ok, false);
  if (!stolen.ok) assert.equal(stolen.code, "not_claimable");
});

test("expired leases can be recovered by another worker", () => {
  const claimed = claimRefreshJob(job(), "worker-a", now);
  assert.equal(claimed.ok, true);
  if (!claimed.ok) throw new Error("claim");
  const recovered = claimRefreshJob(claimed.job, "worker-b", new Date("2026-10-18T00:06:00.000Z"));
  assert.equal(recovered.ok, true);
  if (recovered.ok) assert.deepEqual({ attempt_count: recovered.job.attempt_count, lease_owner: recovered.job.lease_owner }, { attempt_count: 2, lease_owner: "worker-b" });
});

test("retryable results schedule bounded exponential backoff and redact details", () => {
  const claimed = claimRefreshJob(job(), "worker-a", now);
  assert.equal(claimed.ok, true);
  if (!claimed.ok) throw new Error("claim");
  const retry = recordRefreshJobResult(claimed.job, { outcome: "retryable", error_code: "HTTP 503", detail: "bearer secret-value\nprivate detail" }, now);
  assert.equal(retry.ok, true);
  if (retry.ok) {
    assert.equal(retry.job.state, "retryable");
    assert.equal(retry.job.available_at, "2026-10-18T00:01:00.000Z");
    assert.equal(retry.job.last_error_code, "HTTP_503");
    assert.equal(retry.job.last_error_detail, "[redacted] private detail");
  }
});

test("deferred results return work to the queue without manufacturing a retry", () => {
  const now = new Date("2026-01-01T00:00:00.000Z");
  const created = createRefreshJob({ id: "job-deferred", workspace_id: "workspace-1", kind: "catalog_recompute", dedupe_key: "window:deferred", now });
  assert.equal(created.ok, true);
  if (!created.ok) return;
  const claimed = claimRefreshJob(created.job, "worker-1", now);
  assert.equal(claimed.ok, true);
  if (!claimed.ok) return;
  const deferred = recordRefreshJobResult(claimed.job, { outcome: "deferred", detail: "worker deadline deferred this job" }, new Date("2026-01-01T00:00:01.000Z"));
  assert.equal(deferred.ok, true);
  if (!deferred.ok) return;
  assert.equal(deferred.job.state, "queued");
  assert.equal(deferred.job.attempt_count, 1);
  assert.equal(deferred.job.last_error_code, null);
  assert.equal(deferred.job.completed_at, null);
  assert.equal(deferred.job.available_at, "2026-01-01T00:00:01.000Z");
});

test("permanent failures and exhausted retries become terminal", () => {
  const claimed = claimRefreshJob(job(), "worker-a", now);
  assert.equal(claimed.ok, true);
  if (!claimed.ok) throw new Error("claim");
  const failed = recordRefreshJobResult(claimed.job, { outcome: "failed", error_code: "bad_projection" }, now);
  assert.equal(failed.ok, true);
  if (failed.ok) assert.equal(failed.job.state, "failed");
  assert.equal(refreshJobBackoffMs(1), 60_000);
  assert.equal(refreshJobBackoffMs(5), 37_500_000);
  assert.equal(refreshJobBackoffMs(9), null);
});

test("successful result clears the lease and is terminal", () => {
  const claimed = claimRefreshJob(job(), "worker-a", now);
  assert.equal(claimed.ok, true);
  if (!claimed.ok) throw new Error("claim");
  const done = recordRefreshJobResult(claimed.job, { outcome: "succeeded" }, now);
  assert.equal(done.ok, true);
  if (done.ok) assert.deepEqual({ state: done.job.state, lease_owner: done.job.lease_owner, completed_at: done.job.completed_at }, { state: "succeeded", lease_owner: null, completed_at: now.toISOString() });
});

test("lease fencing prevents a stale worker from completing recovered work", () => {
  const first = claimRefreshJob(job(), "worker-a", now);
  assert.equal(first.ok, true);
  if (!first.ok) throw new Error("claim");
  const atExpiry = new Date("2026-10-18T00:05:00.000Z");
  const stale = recordRefreshJobResultForOwner(first.job, "worker-a", { outcome: "succeeded" }, atExpiry);
  assert.equal(stale.ok, false);
  if (!stale.ok) assert.equal(stale.code, "lease_expired");

  const recovered = claimRefreshJob(first.job, "worker-b", new Date("2026-10-18T00:06:00.000Z"));
  assert.equal(recovered.ok, true);
  if (!recovered.ok) throw new Error("recovery");
  const wrongOwner = recordRefreshJobResultForOwner(recovered.job, "worker-a", { outcome: "succeeded" }, new Date("2026-10-18T00:06:01.000Z"));
  assert.equal(wrongOwner.ok, false);
  if (!wrongOwner.ok) assert.equal(wrongOwner.code, "invalid_transition");
});
