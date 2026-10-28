const TIMEOUT_MS = 55_000;
const MAX_SUMMARY_BYTES = 16 * 1024;
const MAX_SUMMARY_COUNT = 1_000_000;
const MAX_QUEUE_LAG_MS = 86_400_000;
// Keep each externally scheduled slice small enough to finish well inside the
// App Runner route deadline. Four independent leases match the proven recovery
// profile; later ticks remain resumable if the queue is larger than one tick.
const SCHEDULED_MAX_JOBS = 10;
const SCHEDULED_BATCH_COUNT = 4;

function isScheduledEvent(event) {
  if (event && typeof event === "object") return event.source === "eventbridge_scheduler";
  if (typeof event === "string") {
    try { return JSON.parse(event)?.source === "eventbridge_scheduler"; } catch { return false; }
  }
  return false;
}

function failureClass(error) {
  const message = String(error?.message || "");
  if (message === "refresh worker is not configured") return "configuration";
  if (/^refresh worker returned HTTP \d+$/.test(message)) return "upstream_http";
  if (error?.name === "AbortError") return "timeout";
  return "network_or_unknown";
}

function boundedCount(value) {
  return Number.isFinite(value) && value >= 0 ? Math.min(Math.floor(value), MAX_SUMMARY_COUNT) : 0;
}

function boundedLag(value) {
  return Number.isFinite(value) && value >= 0 ? Math.min(Math.floor(value), MAX_QUEUE_LAG_MS) : 0;
}

async function readBoundedJson(response) {
  const contentLength = Number(response.headers?.get?.("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_SUMMARY_BYTES) return null;
  if (!response.body || typeof response.body.getReader !== "function") return null;
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = value instanceof Uint8Array ? value : new Uint8Array(value || []);
      size += chunk.byteLength;
      if (size > MAX_SUMMARY_BYTES) {
        await reader.cancel();
        return null;
      }
      chunks.push(chunk);
    }
  } finally {
    reader.releaseLock?.();
  }
  try {
    return JSON.parse(new TextDecoder().decode(Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)))));
  } catch {
    return null;
  }
}

async function summarizeWorkerResponses(responses) {
  const summaries = await Promise.all(responses.map((response) => readBoundedJson(response)));
  const parseFailures = summaries.filter((summary) => !summary || typeof summary !== "object" || Array.isArray(summary)).length;
  const valid = summaries.filter((summary) => summary && typeof summary === "object" && !Array.isArray(summary));
  return {
    sample: 1,
    complete: parseFailures === 0,
    parseFailures,
    processed: valid.reduce((total, summary) => total + boundedCount(summary.processed), 0),
    succeeded: valid.reduce((total, summary) => total + boundedCount(summary.succeeded), 0),
    retryable: valid.reduce((total, summary) => total + boundedCount(summary.retryable), 0),
    failed: valid.reduce((total, summary) => total + boundedCount(summary.failed), 0),
    maxQueueLagMs: valid.reduce((max, summary) => Math.max(max, boundedLag(summary.max_queue_lag_ms)), 0),
  };
}

function emitScheduledMetric({ success, failure, workerSummary = null }) {
  const metricName = success ? "ScheduledSuccess" : "ScheduledFailure";
  const summary = workerSummary || { sample: 0, complete: 0, parseFailures: 0, processed: 0, succeeded: 0, retryable: 0, failed: 0, maxQueueLagMs: 0 };
  console.log(JSON.stringify({
    _aws: {
      Timestamp: Date.now(),
      CloudWatchMetrics: [{
        Namespace: "TrackMCP/RefreshScheduler",
        Dimensions: [["FunctionName"]],
        Metrics: [
          { Name: metricName, Unit: "Count" },
          { Name: "WorkerSummarySample", Unit: "Count" },
          { Name: "WorkerSummaryComplete", Unit: "Count" },
          { Name: "WorkerSummaryParseFailures", Unit: "Count" },
          { Name: "WorkerProcessed", Unit: "Count" },
          { Name: "WorkerSucceeded", Unit: "Count" },
          { Name: "WorkerRetryable", Unit: "Count" },
          { Name: "WorkerFailed", Unit: "Count" },
          { Name: "WorkerMaxQueueLagMs", Unit: "Milliseconds" },
        ],
      }],
    },
    FunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME || "refresh-scheduler",
    FailureClass: failure || "none",
    [metricName]: 1,
    WorkerSummarySample: summary.sample,
    WorkerSummaryComplete: summary.complete ? 1 : 0,
    WorkerSummaryParseFailures: summary.parseFailures,
    WorkerProcessed: summary.processed,
    WorkerSucceeded: summary.succeeded,
    WorkerRetryable: summary.retryable,
    WorkerFailed: summary.failed,
    WorkerMaxQueueLagMs: summary.maxQueueLagMs,
    event: "refresh_scheduler_result",
    scheduled: true,
    success,
  }));
}

export async function handler(event = {}) {
  const endpoint = process.env.TRACKMCP_REFRESH_WORKER_URL;
  const token = process.env.TRACKMCP_REFRESH_WORKER_TOKEN;
  const scheduled = isScheduledEvent(event);
  if (!endpoint || !token) {
    const error = new Error("refresh worker is not configured");
    if (scheduled) emitScheduledMetric({ success: false, failure: failureClass(error) });
    throw error;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const batchCount = scheduled ? SCHEDULED_BATCH_COUNT : 1;
    const responses = await Promise.all(Array.from({ length: batchCount }, () => fetch(endpoint, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ max_jobs: SCHEDULED_MAX_JOBS }),
      redirect: "manual",
      signal: controller.signal,
    })));
    const unhealthy = responses.find((response) => !response.ok);
    if (unhealthy) throw new Error(`refresh worker returned HTTP ${unhealthy.status}`);
    if (scheduled) {
      // Emit non-sensitive Embedded Metric Format samples so the health
      // workflow can query both scheduler success and bounded worker freshness
      // without reading log events. Never log the endpoint, token, request
      // body, response content, owner, or error details.
      const workerSummary = await summarizeWorkerResponses(responses);
      emitScheduledMetric({ success: true, failure: null, workerSummary });
    }
    return { statusCode: Math.max(...responses.map((response) => response.status)) };
  } catch (error) {
    controller.abort();
    if (scheduled) emitScheduledMetric({ success: false, failure: failureClass(error) });
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
