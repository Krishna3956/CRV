import test from "node:test";
import assert from "node:assert/strict";
import { claimRefreshJob, createRefreshJob, type TrackMCPRefreshJob } from "./refresh-jobs.ts";
import { REFRESH_WORKER_POLICY, runRefreshJobBatch, runRefreshJobOnce, type RefreshJobClaimStore } from "./refresh-worker.ts";

const now = new Date("2026-10-18T00:00:00.000Z");

function storeFor(initial: TrackMCPRefreshJob): RefreshJobClaimStore & { current: TrackMCPRefreshJob } {
  const store: RefreshJobClaimStore & { current: TrackMCPRefreshJob } = {
    current: initial,
    async claimNext(input: { owner: string; now: Date; leaseMs: number }) {
      if (store.current.state === "succeeded" || store.current.state === "failed") return null;
      const claimed = claimRefreshJob(store.current, input.owner, input.now, input.leaseMs);
      if (!claimed.ok) return null;
      store.current = claimed.job;
      return store.current;
    },
    async saveResult(input: { previous: TrackMCPRefreshJob; next: TrackMCPRefreshJob }) {
      assert.equal(input.previous.id, store.current.id);
      store.current = input.next;
    },
  } satisfies RefreshJobClaimStore & { current: TrackMCPRefreshJob };
  return store;
}

function job(kind: TrackMCPRefreshJob["kind"] = "catalog_recompute") {
  const created = createRefreshJob({ id: "job-1", workspace_id: "ws-1", kind, dedupe_key: "window-1", now });
  assert.equal(created.ok, true);
  if (!created.ok) throw new Error("fixture failed");
  return created.job;
}

test("runs one registered job and persists success", async () => {
  const store = storeFor(job());
  const result = await runRefreshJobOnce({ store, owner: "worker-1", now: () => now, handlers: { catalog_recompute: async () => undefined } });
  assert.equal(result.ok, true);
  if (result.ok && result.state !== "idle") assert.equal(result.state, "succeeded");
  assert.equal(store.current.state, "succeeded");
});

test("missing handlers fail closed without retrying forever", async () => {
  const store = storeFor(job());
  const result = await runRefreshJobOnce({ store, owner: "worker-1", now: () => now, handlers: {} });
  assert.equal(result.ok, true);
  if (result.ok && result.state !== "idle") assert.equal(result.state, "failed");
  assert.equal(store.current.last_error_code, "missing_handler");
});

test("handler failures are retryable and redact secrets and URLs", async () => {
  const store = storeFor(job("fact_projection"));
  const result = await runRefreshJobOnce({
    store,
    owner: "worker-1",
    now: () => now,
    handlers: { fact_projection: async () => { throw new Error("POST https://example.test?token=secret bearer abc123\nprivate"); } },
  });
  assert.equal(result.ok, true);
  assert.equal(store.current.state, "retryable");
  assert.equal(store.current.last_error_code, "handler_failure");
  assert.ok(store.current.last_error_detail);
  assert.equal(store.current.last_error_detail?.includes("abc123"), false);
  assert.equal(store.current.last_error_detail?.includes("https://"), false);
});

test("batch summaries expose only bounded retryable error-code counts", async () => {
  const store = storeFor(job("fact_projection"));
  const result = await runRefreshJobBatch({
    store,
    owner: "worker-diagnostics",
    now: () => now,
    handlers: { fact_projection: async () => { throw new Error("temporary database failure"); } },
  }, { maxJobs: 1 });
  assert.equal(result.retryable, 1);
  assert.deepEqual(result.retryable_error_codes, { handler_failure: 1 });
  assert.equal(JSON.stringify(result.retryable_error_codes).includes("temporary"), false);
});

test("worker does not imply a scheduler", () => {
  assert.equal(REFRESH_WORKER_POLICY.schedulerEnabledByDefault, false);
  assert.equal(REFRESH_WORKER_POLICY.maxJobsPerInvocation, 100);
  assert.equal(REFRESH_WORKER_POLICY.maxBatchJobs, 100);
  assert.equal(REFRESH_WORKER_POLICY.defaultBatchDurationMs, 45_000);
  assert.equal(REFRESH_WORKER_POLICY.maxBatchDurationMs, 60_000);
});

test("batch runner enforces a wall-clock deadline and cancels active work", async () => {
  const store = storeFor(job("fact_projection"));
  let cancelled = false;
  const result = await runRefreshJobBatch({
    store,
    owner: "worker-deadline",
    now: () => now,
    handlers: {
      fact_projection: async ({ signal }) => await new Promise((resolve) => {
        setTimeout(() => { cancelled = signal?.aborted === true; resolve({ outcome: "retryable" as const, error_code: "cancelled" }); }, 25);
      }),
    },
  }, { maxJobs: 1, maxDurationMs: 10 });
  assert.equal(cancelled, true);
  assert.equal(result.aborted, true);
  assert.equal(result.processed, 1);
  assert.equal(store.current.state, "retryable");
});

test("bounded batch runner drains work without creating a scheduler", async () => {
  const jobs = [job("catalog_recompute"), { ...job("fact_projection"), id: "job-2", dedupe_key: "window-2" }];
  const store: RefreshJobClaimStore & { current: TrackMCPRefreshJob[] } = {
    current: jobs,
    async claimNext(input) {
      const index = store.current.findIndex((candidate) => candidate.state === "queued");
      if (index < 0) return null;
      const claimed = claimRefreshJob(store.current[index], input.owner, input.now, input.leaseMs);
      if (!claimed.ok) return null;
      store.current[index] = claimed.job;
      return claimed.job;
    },
    async saveResult(input) {
      const index = store.current.findIndex((candidate) => candidate.id === input.previous.id);
      assert.notEqual(index, -1);
      store.current[index] = input.next;
    },
  };
  const result = await runRefreshJobBatch({
    store,
    owner: "worker-1",
    now: () => now,
    handlers: { catalog_recompute: async () => undefined, fact_projection: async () => undefined },
  }, { maxJobs: 5 });
  assert.equal(result.processed, 2);
  assert.equal(result.succeeded, 2);
  assert.equal(result.retryable, 0);
  assert.equal(result.failed, 0);
  assert.equal(result.idle, true);
  assert.equal(result.aborted, false);
  assert.deepEqual(result.errors, []);
  assert.equal(result.max_attempt_count, 1);
  assert.equal(result.max_queue_lag_ms, 0);
  assert.equal(result.observed_at, now.toISOString());
});

test("batch runner honors cancellation before claiming another job", async () => {
  const store = storeFor(job());
  const controller = new AbortController();
  controller.abort();
  const result = await runRefreshJobBatch({ store, owner: "worker-1", now: () => now, handlers: { catalog_recompute: async () => undefined } }, { maxJobs: 4, signal: controller.signal });
  assert.equal(result.aborted, true);
  assert.equal(result.processed, 0);
  assert.equal(store.current.state, "queued");
});

test("batch cancellation is passed to the active handler", async () => {
  const controller = new AbortController();
  let received: AbortSignal | undefined;
  const store = storeFor(job("fact_projection"));
  const result = await runRefreshJobBatch({
    store,
    owner: "worker-a",
    handlers: { fact_projection: async ({ signal }) => { received = signal; controller.abort(); return { outcome: "succeeded" }; } },
    now: () => new Date("2026-10-18T00:00:00Z"),
  }, { maxJobs: 2, signal: controller.signal });
  assert.equal(result.processed, 1);
  assert.notEqual(received, controller.signal);
  assert.equal(received?.aborted, true);
  assert.equal(result.aborted, true);
});
