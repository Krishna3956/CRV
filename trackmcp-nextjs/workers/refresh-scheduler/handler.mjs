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
      // A non-sensitive marker is consumed by the CloudWatch metric filter.
      // Never log the endpoint, token, request body, or response content.
      console.log(JSON.stringify({ event: "refresh_scheduler_result", scheduled: true, success: true }));
    }
    return { statusCode: response.status };
  } finally {
    clearTimeout(timeout);
  }
}
