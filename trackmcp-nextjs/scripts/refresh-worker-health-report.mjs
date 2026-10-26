import { readFile } from "node:fs/promises";

const DEFAULT_BUDGET_MS = 900_000;
const DEFAULT_MAX_CADENCE_MS = 20 * 60_000;
const MIN_SAMPLES = 3;

function boundedNumber(value, fallback = 0) {
  return Number.isFinite(value) && value >= 0 ? Math.min(value, 31_536_000_000) : fallback;
}

function parseTimestamp(value) {
  const time = Date.parse(value ?? "");
  return Number.isFinite(time) ? time : null;
}

export function summarizeRefreshWorkerRuns(runs, { budgetMs = DEFAULT_BUDGET_MS, maxCadenceMs = DEFAULT_MAX_CADENCE_MS } = {}) {
  const boundedRuns = (Array.isArray(runs) ? runs : [])
    .filter((run) => run && typeof run === "object")
    .map((run) => ({
      run_id: typeof run.run_id === "number" ? run.run_id : null,
      created_at: typeof run.created_at === "string" ? run.created_at : null,
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

  const intervals = [];
  for (let index = 1; index < boundedRuns.length; index += 1) {
    const previous = parseTimestamp(boundedRuns[index - 1].created_at);
    const current = parseTimestamp(boundedRuns[index].created_at);
    if (previous !== null && current !== null && current >= previous) intervals.push(current - previous);
  }
  const staleRuns = boundedRuns.filter((run) => run.freshness_slo === "stale" || run.freshness_alert === "warning").length;
  const failedRuns = boundedRuns.filter((run) => run.conclusion !== "success" || run.failed > 0 || run.retryable > 0).length;
  const cadenceBreaches = intervals.filter((interval) => interval > maxCadenceMs).length;
  const insufficient = boundedRuns.length < MIN_SAMPLES;
  const state = insufficient ? "insufficient_data" : failedRuns > 0 || staleRuns > 0 || cadenceBreaches > 0 ? "warning" : "healthy";
  const reasons = [];
  if (insufficient) reasons.push("minimum_samples_not_met");
  if (failedRuns > 0) reasons.push("worker_failures_observed");
  if (staleRuns > 0) reasons.push("freshness_budget_exceeded");
  if (cadenceBreaches > 0) reasons.push("schedule_cadence_gap");

  return {
    version: 1,
    state,
    reasons,
    sample_count: boundedRuns.length,
    minimum_samples: MIN_SAMPLES,
    freshness_budget_ms: boundedNumber(budgetMs, DEFAULT_BUDGET_MS),
    max_cadence_ms: boundedNumber(maxCadenceMs, DEFAULT_MAX_CADENCE_MS),
    stale_runs: staleRuns,
    failed_runs: failedRuns,
    cadence_breaches: cadenceBreaches,
    max_queue_lag_ms: Math.max(0, ...boundedRuns.map((run) => run.max_queue_lag_ms)),
    total_processed: boundedRuns.reduce((total, run) => total + run.processed, 0),
    runs: boundedRuns.map(({ run_id, created_at, observed_at, freshness_slo, freshness_alert, max_queue_lag_ms, processed, failed, retryable }) => ({ run_id, created_at, observed_at, freshness_slo, freshness_alert, max_queue_lag_ms, processed, failed, retryable })),
  };
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const inputPath = process.argv[2];
  if (!inputPath) throw new Error("Usage: node refresh-worker-health-report.mjs <runs.json>");
  const source = (await readFile(inputPath, "utf8")).trim();
  const input = source ? source.split(/\r?\n/).map((line) => JSON.parse(line)) : [];
  process.stdout.write(`${JSON.stringify(summarizeRefreshWorkerRuns(input), null, 2)}\n`);
}
