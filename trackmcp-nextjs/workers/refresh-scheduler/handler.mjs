const TIMEOUT_MS = 55_000;
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

function emitScheduledMetric({ success, failure }) {
  const metricName = success ? "ScheduledSuccess" : "ScheduledFailure";
  console.log(JSON.stringify({
    _aws: {
      Timestamp: Date.now(),
      CloudWatchMetrics: [{
        Namespace: "TrackMCP/RefreshScheduler",
        Dimensions: [["FunctionName"]],
        Metrics: [{ Name: metricName, Unit: "Count" }],
      }],
    },
    FunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME || "refresh-scheduler",
    FailureClass: failure || "none",
    [metricName]: 1,
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
      // Emit a non-sensitive Embedded Metric Format sample so the health
      // workflow can query the success count without reading log events. Never
      // log the endpoint, token, request body, or response content.
      emitScheduledMetric({ success: true, failure: null });
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
