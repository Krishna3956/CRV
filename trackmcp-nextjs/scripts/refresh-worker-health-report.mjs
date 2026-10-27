import { readFile } from "node:fs/promises";

const DEFAULT_BUDGET_MS = 900_000;
const DEFAULT_MAX_CADENCE_MS = 20 * 60_000;
const DEFAULT_EVALUATION_WINDOW_MS = 60 * 60_000;
const MIN_SAMPLES = 3;

function boundedNumber(value, fallback = 0) {
  return Number.isFinite(value) && value >= 0 ? Math.min(value, 31_536_000_000) : fallback;
}

function parseTimestamp(value) {
  const time = Date.parse(value ?? "");
  return Number.isFinite(time) ? time : null;
}

function normalizeAwsSchedulerEvidence(value) {
  const source = value && typeof value === "object" ? value : {};
  const datapoints = Array.isArray(source.datapoints) ? source.datapoints.filter((item) => item && typeof item === "object").slice(0, 32) : [];
  const invocations = boundedNumber(source.invocations);
  const errors = boundedNumber(source.errors);
  const scheduledSuccesses = boundedNumber(source.scheduled_successes);
  const scheduledFailures = boundedNumber(source.scheduled_failures);
  const scheduledSuccessesAvailable = source.scheduled_successes_available === true;
  const healthy = datapoints.length > 0 && invocations > 0 && errors === 0;
  return {
    enabled: source.enabled === true,
    datapoints: datapoints.length,
    invocations,
    errors,
    scheduled_successes: scheduledSuccesses,
    scheduled_failures: scheduledFailures,
    scheduled_successes_available: scheduledSuccessesAvailable,
    healthy,
  };
}

export function summarizeRefreshWorkerRuns(runs, { budgetMs = DEFAULT_BUDGET_MS, maxCadenceMs = DEFAULT_MAX_CADENCE_MS, evaluationWindowMs = DEFAULT_EVALUATION_WINDOW_MS, awsScheduler = null } = {}) {
  const boundedRuns = (Array.isArray(runs) ? runs : [])
    .filter((run) => run && typeof run === "object")
    .map((run) => ({
      run_id: typeof run.run_id === "number" ? run.run_id : null,
      created_at: typeof run.created_at === "string" ? run.created_at : null,
      event: typeof run.event === "string" ? run.event : "schedule",
      conclusion: typeof run.conclusion === "string" ? run.conclusion : "unknown",
      observed_at: typeof run.observed_at === "string" ? run.observed_at : null,
      freshness_slo: typeof run.freshness_slo === "string" ? run.freshness_slo : "unknown",
      freshness_alert: typeof run.freshness_alert === "string" ? run.freshness_alert : "unknown",
      max_queue_lag_ms: boundedNumber(run.max_queue_lag_ms),
      processed: boundedNumber(run.processed),
      failed: boundedNumber(run.failed),
      retryable: boundedNumber(run.retryable),
    }))
    .sort((a, b) => (parseTimestamp(a.created_at) ?? 0) - (parseTimestamp(b.created_at) ?? 0))
    .slice(-8);

  const latestRunTime = parseTimestamp(boundedRuns.at(-1)?.created_at);
  const evaluationWindow = boundedNumber(evaluationWindowMs, DEFAULT_EVALUATION_WINDOW_MS);
  const evaluationRuns = latestRunTime === null
    ? boundedRuns
    : boundedRuns.filter((run) => {
      const created = parseTimestamp(run.created_at);
      return created === null || created >= latestRunTime - evaluationWindow;
    });

  const intervals = [];
  for (let index = 1; index < evaluationRuns.length; index += 1) {
    const previous = parseTimestamp(evaluationRuns[index - 1].created_at);
    const current = parseTimestamp(evaluationRuns[index].created_at);
    if (previous !== null && current !== null && current >= previous) intervals.push(current - previous);
  }
  const staleRuns = evaluationRuns.filter((run) => run.freshness_slo === "stale" || run.freshness_alert === "warning").length;
  const failedRuns = evaluationRuns.filter((run) => run.conclusion !== "success" || run.failed > 0 || run.retryable > 0).length;
  const cadenceBreaches = intervals.filter((interval) => interval > maxCadenceMs).length;
  const awsEvidence = normalizeAwsSchedulerEvidence(awsScheduler);
  const scheduledSampleCount = evaluationRuns.filter((run) => run.event === "schedule").length;
  const insufficient = evaluationRuns.length < MIN_SAMPLES;
  // EventBridge/Lambda is the production scheduler. GitHub cron is only a
  // recovery path, so a healthy AWS metric window satisfies the scheduler
  // evidence requirement even when GitHub has missed a tick.
  const scheduledInsufficient = scheduledSampleCount < MIN_SAMPLES && !awsEvidence.healthy;
  const effectiveCadenceBreaches = awsEvidence.healthy ? 0 : cadenceBreaches;
  const awsErrorsObserved = awsEvidence.enabled && awsEvidence.datapoints > 0 && awsEvidence.errors > 0;
  const scheduledCadenceGate = {
    status: scheduledSampleCount >= MIN_SAMPLES ? "proven" : "pending",
    observed_samples: scheduledSampleCount,
    required_samples: MIN_SAMPLES,
    evidence: scheduledSampleCount >= MIN_SAMPLES ? "scheduled_runs" : awsEvidence.healthy ? "aws_metrics_only" : "insufficient_scheduled_samples",
  };
  const awsSchedulerCadenceGate = {
    status: awsEvidence.enabled && awsEvidence.datapoints > 0 && awsEvidence.invocations >= MIN_SAMPLES && awsEvidence.errors === 0 ? "proven" : "pending",
    observed_invocations: awsEvidence.invocations,
    required_invocations: MIN_SAMPLES,
    evidence: awsEvidence.enabled && awsEvidence.datapoints > 0 && awsEvidence.invocations >= MIN_SAMPLES && awsEvidence.errors === 0
      ? "aws_lambda_metrics_window"
      : awsEvidence.enabled ? "insufficient_aws_metrics" : "aws_scheduler_not_enabled",
  };
  const awsEndToEndCadenceGate = {
    status: awsEvidence.scheduled_successes >= MIN_SAMPLES ? "proven" : "pending",
    observed_successes: awsEvidence.scheduled_successes,
    required_successes: MIN_SAMPLES,
    evidence: awsEvidence.scheduled_successes >= MIN_SAMPLES
      ? "cloudwatch_emf_metric"
      : awsEvidence.scheduled_successes_available ? "scheduled_success_metric_pending" : "cloudwatch_metric_unavailable",
  };
  const state = insufficient ? "insufficient_data" : failedRuns > 0 || staleRuns > 0 || effectiveCadenceBreaches > 0 || scheduledInsufficient || awsErrorsObserved ? "warning" : "healthy";
  const reasons = [];
  if (insufficient) reasons.push("minimum_samples_not_met");
  if (scheduledInsufficient && !insufficient) reasons.push("scheduled_samples_not_met");
  if (failedRuns > 0) reasons.push("worker_failures_observed");
  if (staleRuns > 0) reasons.push("freshness_budget_exceeded");
  if (effectiveCadenceBreaches > 0) reasons.push("schedule_cadence_gap");
  if (awsErrorsObserved) reasons.push("aws_scheduler_errors_observed");
  if (awsEvidence.scheduled_failures > 0) reasons.push("scheduled_refresh_failures_observed");
  if (awsEvidence.enabled && awsEvidence.datapoints === 0) reasons.push("aws_scheduler_evidence_missing");

  return {
    version: 1,
    state,
    reasons,
    sample_count: boundedRuns.length,
    evaluation_sample_count: evaluationRuns.length,
    evaluation_window_ms: evaluationWindow,
    minimum_samples: MIN_SAMPLES,
    scheduled_sample_count: scheduledSampleCount,
    minimum_scheduled_samples: MIN_SAMPLES,
    scheduled_cadence_gate: scheduledCadenceGate,
    aws_scheduler_cadence_gate: awsSchedulerCadenceGate,
    aws_end_to_end_cadence_gate: awsEndToEndCadenceGate,
    freshness_budget_ms: boundedNumber(budgetMs, DEFAULT_BUDGET_MS),
    max_cadence_ms: boundedNumber(maxCadenceMs, DEFAULT_MAX_CADENCE_MS),
    stale_runs: staleRuns,
    failed_runs: failedRuns,
    cadence_breaches: cadenceBreaches,
    scheduler_evidence: awsEvidence,
    max_queue_lag_ms: Math.max(0, ...boundedRuns.map((run) => run.max_queue_lag_ms)),
    total_processed: boundedRuns.reduce((total, run) => total + run.processed, 0),
    runs: boundedRuns.map(({ run_id, created_at, event, observed_at, freshness_slo, freshness_alert, max_queue_lag_ms, processed, failed, retryable }) => ({ run_id, created_at, event, observed_at, freshness_slo, freshness_alert, max_queue_lag_ms, processed, failed, retryable })),
  };
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const inputPath = process.argv[2];
  if (!inputPath) throw new Error("Usage: node refresh-worker-health-report.mjs <runs.json>");
  const source = (await readFile(inputPath, "utf8")).trim();
  const input = source ? source.split(/\r?\n/).map((line) => JSON.parse(line)) : [];
  const awsPath = process.argv[3];
  let awsScheduler = null;
  if (awsPath) {
    try {
      awsScheduler = JSON.parse(await readFile(awsPath, "utf8"));
    } catch {
      // Missing optional AWS evidence is represented explicitly by the
      // report rather than making a health run fail open.
      awsScheduler = { enabled: true, datapoints: [], invocations: 0, errors: 0 };
    }
  }
  process.stdout.write(`${JSON.stringify(summarizeRefreshWorkerRuns(input, { awsScheduler }), null, 2)}\n`);
}
