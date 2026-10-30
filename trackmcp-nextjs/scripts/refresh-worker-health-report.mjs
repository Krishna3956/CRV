import { readFile } from "node:fs/promises";

const DEFAULT_BUDGET_MS = 900_000;
const DEFAULT_MAX_CADENCE_MS = 20 * 60_000;
const DEFAULT_EVALUATION_WINDOW_MS = 60 * 60_000;
const MIN_SAMPLES = 3;

function boundedNumber(value, fallback = 0) {
  return Number.isFinite(value) && value >= 0 ? Math.min(value, 31_536_000_000) : fallback;
}

function boundedHistogram(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.entries(value)
    .filter(([key, count]) => /^[a-zA-Z0-9_.-]{1,80}$/.test(key) && Number.isFinite(count) && count >= 0)
    .slice(0, 8)
    .reduce((result, [key, count]) => ({ ...result, [key]: Math.min(1000, Math.floor(count)) }), {});
}

function latestMetricTimestamp(datapoints) {
  return datapoints
    .flatMap((item) => Array.isArray(item.timestamps) ? item.timestamps : [])
    .map((value) => ({ value, time: parseTimestamp(value) }))
    .filter((item) => item.time !== null)
    .sort((a, b) => b.time - a.time)[0]?.value ?? null;
}

function maxMetricTimestamp(datapoints, id) {
  const point = datapoints.find((item) => item.id === id);
  if (!point || !Array.isArray(point.values) || !Array.isArray(point.timestamps)) return null;
  let maxIndex = -1;
  let maxValue = -1;
  for (let index = 0; index < point.values.length; index += 1) {
    const value = boundedNumber(point.values[index], -1);
    if (value > maxValue && parseTimestamp(point.timestamps[index]) !== null) {
      maxValue = value;
      maxIndex = index;
    }
  }
  return maxIndex === -1 ? null : point.timestamps[maxIndex];
}

function parseTimestamp(value) {
  const time = Date.parse(value ?? "");
  return Number.isFinite(time) ? time : null;
}

function normalizeAwsSchedulerEvidence(value, budgetMs = DEFAULT_BUDGET_MS) {
  const source = value && typeof value === "object" ? value : {};
  const datapoints = Array.isArray(source.datapoints) ? source.datapoints.filter((item) => item && typeof item === "object").slice(0, 32) : [];
  const invocations = boundedNumber(source.invocations);
  const errors = boundedNumber(source.errors);
  const scheduledSuccesses = boundedNumber(source.scheduled_successes);
  const scheduledFailures = boundedNumber(source.scheduled_failures);
  const scheduledSuccessesAvailable = source.scheduled_successes_available === true;
  const healthy = datapoints.length > 0 && invocations > 0 && errors === 0;
  const worker = source.worker_summary && typeof source.worker_summary === "object" ? source.worker_summary : {};
  const workerSamples = boundedNumber(worker.samples);
  const workerCompleteSamples = boundedNumber(worker.complete_samples);
  const workerParseFailures = boundedNumber(worker.parse_failures);
  const workerFailed = boundedNumber(worker.failed);
  const workerRetryable = boundedNumber(worker.retryable);
  const workerMaxQueueLagMs = boundedNumber(worker.max_queue_lag_ms);
  const workerMetricsAvailable = worker.available === true || workerSamples > 0;
  const workerHealthy = workerMetricsAvailable
    && workerSamples >= MIN_SAMPLES
    && workerCompleteSamples >= workerSamples
    && workerParseFailures === 0
    && workerFailed === 0
    && workerRetryable === 0
    && workerMaxQueueLagMs <= boundedNumber(budgetMs, DEFAULT_BUDGET_MS);
  return {
    enabled: source.enabled === true,
    datapoints: datapoints.length,
    latest_metric_timestamp: latestMetricTimestamp(datapoints),
    worker_max_queue_lag_timestamp: maxMetricTimestamp(datapoints, "worker_max_queue_lag"),
    invocations,
    errors,
    scheduled_successes: scheduledSuccesses,
    scheduled_failures: scheduledFailures,
    scheduled_successes_available: scheduledSuccessesAvailable,
    healthy,
    worker_metrics_available: workerMetricsAvailable,
    worker_samples: workerSamples,
    worker_complete_samples: workerCompleteSamples,
    worker_parse_failures: workerParseFailures,
    worker_failed: workerFailed,
    worker_retryable: workerRetryable,
    worker_max_queue_lag_ms: workerMaxQueueLagMs,
    worker_healthy: workerHealthy,
  };
}

export function summarizeRefreshWorkerRuns(runs, { budgetMs = DEFAULT_BUDGET_MS, maxCadenceMs = DEFAULT_MAX_CADENCE_MS, evaluationWindowMs = DEFAULT_EVALUATION_WINDOW_MS, awsScheduler = null } = {}) {
  const boundedRuns = (Array.isArray(runs) ? runs : [])
    .filter((run) => run && typeof run === "object")
    .map((run) => {
      const timedOut = run.timed_out === true;
      const workflowFailed = run.workflow_failed === true;
      const unparseable = boundedNumber(run.batches_with_unparseable_response);
      const incomplete = timedOut || workflowFailed || unparseable > 0;
      return {
        run_id: typeof run.run_id === "number" ? run.run_id : null,
        created_at: typeof run.created_at === "string" ? run.created_at : null,
        event: typeof run.event === "string" ? run.event : "schedule",
        conclusion: typeof run.conclusion === "string" ? run.conclusion : "unknown",
        observed_at: typeof run.observed_at === "string" ? run.observed_at : null,
        // Old artifacts may predate the timeout fields. Derive the row-level
        // status from the durable bounded flags so they cannot display an
        // empty healthy queue when the response was incomplete.
        freshness_slo: incomplete ? "unknown" : typeof run.freshness_slo === "string" ? run.freshness_slo : "unknown",
        freshness_alert: incomplete ? "warning" : typeof run.freshness_alert === "string" ? run.freshness_alert : "unknown",
        max_queue_lag_ms: boundedNumber(run.max_queue_lag_ms),
        processed: boundedNumber(run.processed),
        failed: boundedNumber(run.failed),
        retryable: boundedNumber(run.retryable),
        retryable_error_codes: boundedHistogram(run.retryable_error_codes),
        retryable_error_kinds: boundedHistogram(run.retryable_error_kinds),
        timed_out: timedOut,
        workflow_failed: workflowFailed,
        batches_with_unparseable_response: unparseable,
      };
    })
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
  const incompleteRuns = evaluationRuns.filter((run) => run.timed_out || run.workflow_failed || run.batches_with_unparseable_response > 0).length;
  const cadenceBreaches = intervals.filter((interval) => interval > maxCadenceMs).length;
  const awsEvidence = normalizeAwsSchedulerEvidence(awsScheduler, budgetMs);
  const scheduledSampleCount = evaluationRuns.filter((run) => run.event === "schedule").length;
  // EventBridge/Lambda is the production scheduler. GitHub cron is only a
  // recovery path, so a healthy AWS metric window satisfies the scheduler
  // evidence requirement even when GitHub has missed a tick.
  const insufficient = evaluationRuns.length < MIN_SAMPLES && !awsEvidence.healthy;
  const scheduledInsufficient = scheduledSampleCount < MIN_SAMPLES && !awsEvidence.healthy;
  const effectiveCadenceBreaches = awsEvidence.healthy ? 0 : cadenceBreaches;
  const awsErrorsObserved = awsEvidence.enabled && awsEvidence.datapoints > 0 && awsEvidence.errors > 0;
  const workerCadenceProven = awsEvidence.worker_healthy;
  const awsWorkerFreshnessWarning = awsEvidence.worker_metrics_available && !awsEvidence.worker_healthy;
  const scheduledCadenceGate = {
    status: scheduledSampleCount >= MIN_SAMPLES || workerCadenceProven ? "proven" : "pending",
    observed_samples: scheduledSampleCount,
    required_samples: MIN_SAMPLES,
    evidence: scheduledSampleCount >= MIN_SAMPLES
      ? "scheduled_runs"
      : workerCadenceProven
        ? "aws_worker_metrics"
        : awsEvidence.healthy ? "aws_metrics_only" : "insufficient_scheduled_samples",
  };
  const workerFreshnessGate = {
    status: workerCadenceProven ? "proven" : "pending",
    observed_samples: awsEvidence.worker_samples,
    required_samples: MIN_SAMPLES,
    evidence: workerCadenceProven
      ? "aws_worker_metrics"
      : awsEvidence.worker_metrics_available ? "aws_worker_metrics_not_healthy" : "aws_worker_metrics_unavailable",
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
  const state = insufficient ? "insufficient_data" : failedRuns > 0 || incompleteRuns > 0 || staleRuns > 0 || effectiveCadenceBreaches > 0 || scheduledInsufficient || awsErrorsObserved || awsWorkerFreshnessWarning ? "warning" : "healthy";
  const reasons = [];
  if (insufficient) reasons.push("minimum_samples_not_met");
  if (scheduledInsufficient && !insufficient) reasons.push("scheduled_samples_not_met");
  if (failedRuns > 0) reasons.push("worker_failures_observed");
  if (incompleteRuns > 0) reasons.push("worker_execution_incomplete");
  if (staleRuns > 0) reasons.push("freshness_budget_exceeded");
  if (effectiveCadenceBreaches > 0) reasons.push("schedule_cadence_gap");
  if (awsErrorsObserved) reasons.push("aws_scheduler_errors_observed");
  if (awsWorkerFreshnessWarning) reasons.push("aws_worker_freshness_not_proven");
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
    worker_freshness_gate: workerFreshnessGate,
    aws_scheduler_cadence_gate: awsSchedulerCadenceGate,
    aws_end_to_end_cadence_gate: awsEndToEndCadenceGate,
    freshness_budget_ms: boundedNumber(budgetMs, DEFAULT_BUDGET_MS),
    max_cadence_ms: boundedNumber(maxCadenceMs, DEFAULT_MAX_CADENCE_MS),
    stale_runs: staleRuns,
    failed_runs: failedRuns,
    incomplete_runs: incompleteRuns,
    cadence_breaches: cadenceBreaches,
    scheduler_evidence: awsEvidence,
    max_queue_lag_ms: Math.max(0, ...boundedRuns.map((run) => run.max_queue_lag_ms)),
    total_processed: boundedRuns.reduce((total, run) => total + run.processed, 0),
    runs: boundedRuns.map(({ run_id, created_at, event, observed_at, freshness_slo, freshness_alert, max_queue_lag_ms, processed, failed, retryable, retryable_error_codes, retryable_error_kinds, timed_out, workflow_failed, batches_with_unparseable_response }) => ({ run_id, created_at, event, observed_at, freshness_slo, freshness_alert, max_queue_lag_ms, processed, failed, retryable, retryable_error_codes, retryable_error_kinds, timed_out, workflow_failed, batches_with_unparseable_response })),
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
