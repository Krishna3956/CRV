const TIMEOUT_MS = 55_000;

export async function handler(event = {}) {
  const endpoint = process.env.TRACKMCP_REFRESH_WORKER_URL;
  const token = process.env.TRACKMCP_REFRESH_WORKER_TOKEN;
  if (!endpoint || !token) throw new Error("refresh worker is not configured");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ max_jobs: 100 }),
      redirect: "manual",
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`refresh worker returned HTTP ${response.status}`);
    if (event && event.source === "eventbridge_scheduler") {
      // Emit a non-sensitive Embedded Metric Format sample so the health
      // workflow can query the success count without reading log events. Never
      // log the endpoint, token, request body, or response content.
      console.log(JSON.stringify({
        _aws: {
          Timestamp: Date.now(),
          CloudWatchMetrics: [{
            Namespace: "TrackMCP/RefreshScheduler",
            Dimensions: [["FunctionName"]],
            Metrics: [{ Name: "ScheduledSuccess", Unit: "Count" }],
          }],
        },
        FunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME || "refresh-scheduler",
        ScheduledSuccess: 1,
        event: "refresh_scheduler_result",
        scheduled: true,
        success: true,
      }));
    }
    return { statusCode: response.status };
  } finally {
    clearTimeout(timeout);
  }
}
