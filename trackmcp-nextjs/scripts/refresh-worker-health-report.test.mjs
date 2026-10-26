import assert from "node:assert/strict";
import test from "node:test";
import { summarizeRefreshWorkerRuns } from "./refresh-worker-health-report.mjs";

const run = (overrides = {}) => ({
  run_id: 1,
  created_at: "2026-10-26T00:00:00Z",
  observed_at: "2026-10-26T00:00:05Z",
  conclusion: "success",
  freshness_slo: "within_budget",
  freshness_alert: "none",
  max_queue_lag_ms: 10,
  processed: 4,
  failed: 0,
  retryable: 0,
  ...overrides,
});

test("worker health requires a bounded sample before claiming health", () => {
  const report = summarizeRefreshWorkerRuns([run()]);
  assert.equal(report.state, "insufficient_data");
  assert.deepEqual(report.reasons, ["minimum_samples_not_met"]);
});

test("worker health reports healthy only for repeated in-budget runs", () => {
  const report = summarizeRefreshWorkerRuns([
    run({ run_id: 1, created_at: "2026-10-26T00:00:00Z" }),
    run({ run_id: 2, created_at: "2026-10-26T00:05:00Z" }),
    run({ run_id: 3, created_at: "2026-10-26T00:10:00Z" }),
  ]);
  assert.equal(report.state, "healthy");
  assert.deepEqual(report.reasons, []);
  assert.equal(report.sample_count, 3);
});

test("worker health surfaces stale, failed, and cadence evidence without payloads", () => {
  const report = summarizeRefreshWorkerRuns([
    run({ run_id: 1, created_at: "2026-10-26T00:00:00Z" }),
    run({ run_id: 2, created_at: "2026-10-26T00:30:00Z", freshness_slo: "stale", freshness_alert: "warning", max_queue_lag_ms: 1_500_000 }),
    run({ run_id: 3, created_at: "2026-10-26T00:35:00Z", conclusion: "failure", failed: 1 }),
  ]);
  assert.equal(report.state, "warning");
  assert.deepEqual(report.reasons, ["worker_failures_observed", "freshness_budget_exceeded", "schedule_cadence_gap"]);
  assert.equal(report.max_queue_lag_ms, 1_500_000);
  assert.equal(JSON.stringify(report).includes("private"), false);
});
