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

test("recovery runs contribute evidence but cannot replace scheduled samples", () => {
  const report = summarizeRefreshWorkerRuns([
    run({ run_id: 1, event: "workflow_dispatch", created_at: "2026-10-26T00:00:00Z" }),
    run({ run_id: 2, event: "workflow_dispatch", created_at: "2026-10-26T00:05:00Z" }),
    run({ run_id: 3, event: "workflow_dispatch", created_at: "2026-10-26T00:10:00Z" }),
  ]);
  assert.equal(report.sample_count, 3);
  assert.equal(report.scheduled_sample_count, 0);
  assert.equal(report.state, "warning");
  assert.deepEqual(report.reasons, ["scheduled_samples_not_met"]);
  assert.equal(report.runs[0].event, "workflow_dispatch");
});

test("worker health surfaces stale, failed, and cadence evidence without payloads", () => {
  const report = summarizeRefreshWorkerRuns([
    run({ run_id: 1, event: "workflow_dispatch", created_at: "2026-10-26T00:00:00Z" }),
    run({ run_id: 2, event: "workflow_dispatch", created_at: "2026-10-26T00:30:00Z", freshness_slo: "stale", freshness_alert: "warning", max_queue_lag_ms: 1_500_000 }),
    run({ run_id: 3, event: "workflow_dispatch", created_at: "2026-10-26T00:35:00Z", conclusion: "failure", failed: 1 }),
  ]);
  assert.equal(report.state, "warning");
  assert.deepEqual(report.reasons, ["scheduled_samples_not_met", "worker_failures_observed", "freshness_budget_exceeded", "schedule_cadence_gap"]);
  assert.equal(report.max_queue_lag_ms, 1_500_000);
  assert.equal(JSON.stringify(report).includes("private"), false);
});

test("historical failures do not poison the bounded current health window", () => {
  const report = summarizeRefreshWorkerRuns([
    run({ run_id: 1, created_at: "2026-10-26T00:00:00Z", conclusion: "failure", failed: 1, freshness_slo: "stale" }),
    run({ run_id: 2, created_at: "2026-10-26T01:00:00Z" }),
    run({ run_id: 3, created_at: "2026-10-26T01:05:00Z" }),
    run({ run_id: 4, created_at: "2026-10-26T01:10:00Z" }),
  ], { evaluationWindowMs: 60 * 60_000, awsScheduler: { enabled: true, invocations: 3, errors: 0, datapoints: [{ id: "invocations" }] } });
  assert.equal(report.sample_count, 4);
  assert.equal(report.evaluation_sample_count, 3);
  assert.equal(report.failed_runs, 0);
  assert.equal(report.stale_runs, 0);
  assert.equal(report.state, "healthy");
  assert.deepEqual(report.reasons, []);
});

test("healthy AWS scheduler evidence satisfies production cadence without hiding worker failures", () => {
  const report = summarizeRefreshWorkerRuns([
    run({ run_id: 1, event: "workflow_dispatch", created_at: "2026-10-26T00:00:00Z" }),
    run({ run_id: 2, event: "workflow_dispatch", created_at: "2026-10-26T00:30:00Z", freshness_slo: "stale", freshness_alert: "warning", max_queue_lag_ms: 1_500_000 }),
    run({ run_id: 3, event: "workflow_dispatch", created_at: "2026-10-26T00:35:00Z", conclusion: "failure", failed: 1 }),
  ], { awsScheduler: { enabled: true, invocations: 5, errors: 0, scheduled_successes: 4, scheduled_successes_available: true, datapoints: [{ id: "invocations" }, { id: "errors" }, { id: "scheduled_successes" }] } });
  assert.equal(report.scheduler_evidence.healthy, true);
  assert.equal(report.scheduler_evidence.invocations, 5);
  assert.deepEqual(report.scheduled_cadence_gate, {
    status: "pending",
    observed_samples: 0,
    required_samples: 3,
    evidence: "aws_metrics_only",
  });
  assert.deepEqual(report.aws_scheduler_cadence_gate, {
    status: "proven",
    observed_invocations: 5,
    required_invocations: 3,
    evidence: "aws_lambda_metrics_window",
  });
  assert.deepEqual(report.aws_end_to_end_cadence_gate, {
    status: "proven",
    observed_successes: 4,
    required_successes: 3,
    evidence: "cloudwatch_emf_metric",
  });
  assert.equal(report.cadence_breaches, 1);
  assert.deepEqual(report.reasons, ["worker_failures_observed", "freshness_budget_exceeded"]);
});

test("healthy AWS scheduler evidence can close health with fewer GitHub recovery samples", () => {
  const report = summarizeRefreshWorkerRuns([
    run({ run_id: 1, event: "workflow_dispatch", created_at: "2026-10-26T00:00:00Z" }),
  ], { awsScheduler: { enabled: true, invocations: 3, errors: 0, scheduled_successes: 3, scheduled_successes_available: true, datapoints: [{ id: "invocations" }, { id: "errors" }, { id: "scheduled_successes" }] } });
  assert.equal(report.state, "healthy");
  assert.deepEqual(report.reasons, []);
  assert.equal(report.evaluation_sample_count, 1);
  assert.equal(report.scheduled_sample_count, 0);
  assert.equal(report.aws_scheduler_cadence_gate.status, "proven");
  assert.equal(report.aws_end_to_end_cadence_gate.status, "proven");
});

test("scheduled cadence gate becomes proven only from scheduled worker samples", () => {
  const report = summarizeRefreshWorkerRuns([
    run({ run_id: 1, event: "schedule", created_at: "2026-10-26T00:00:00Z" }),
    run({ run_id: 2, event: "schedule", created_at: "2026-10-26T00:05:00Z" }),
    run({ run_id: 3, event: "schedule", created_at: "2026-10-26T00:10:00Z" }),
  ]);
  assert.deepEqual(report.scheduled_cadence_gate, {
    status: "proven",
    observed_samples: 3,
    required_samples: 3,
    evidence: "scheduled_runs",
  });
  assert.deepEqual(report.aws_scheduler_cadence_gate, {
    status: "pending",
    observed_invocations: 0,
    required_invocations: 3,
    evidence: "aws_scheduler_not_enabled",
  });
  assert.deepEqual(report.aws_end_to_end_cadence_gate, {
    status: "pending",
    observed_successes: 0,
    required_successes: 3,
    evidence: "cloudwatch_metric_unavailable",
  });
});

test("AWS scheduler errors remain visible as a distinct health reason", () => {
  const report = summarizeRefreshWorkerRuns([
    run({ run_id: 1, event: "schedule", created_at: "2026-10-26T00:00:00Z" }),
    run({ run_id: 2, event: "schedule", created_at: "2026-10-26T00:05:00Z" }),
    run({ run_id: 3, event: "schedule", created_at: "2026-10-26T00:10:00Z" }),
  ], { awsScheduler: { enabled: true, invocations: 3, errors: 2, datapoints: [{ id: "invocations" }, { id: "errors" }] } });
  assert.equal(report.state, "warning");
  assert.deepEqual(report.reasons, ["aws_scheduler_errors_observed"]);
});

test("timed out or unparseable batches cannot be reported as an empty healthy queue", () => {
  const report = summarizeRefreshWorkerRuns([
    run({ run_id: 1, event: "schedule", created_at: "2026-10-26T00:00:00Z" }),
    run({ run_id: 2, event: "schedule", created_at: "2026-10-26T00:05:00Z" }),
    run({ run_id: 3, event: "schedule", created_at: "2026-10-26T00:10:00Z", max_queue_lag_ms: 0, timed_out: true, batches_with_unparseable_response: 10, freshness_slo: "unknown", freshness_alert: "warning" }),
  ]);
  assert.equal(report.state, "warning");
  assert.equal(report.incomplete_runs, 1);
  assert.deepEqual(report.reasons, ["worker_execution_incomplete", "freshness_budget_exceeded"]);
  assert.equal(report.runs.at(-1).timed_out, true);
  assert.equal(report.runs.at(-1).batches_with_unparseable_response, 10);
  assert.equal(report.runs.at(-1).freshness_slo, "unknown");
  assert.equal(report.runs.at(-1).freshness_alert, "warning");
});
