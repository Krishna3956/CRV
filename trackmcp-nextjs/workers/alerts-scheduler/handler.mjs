const TIMEOUT_MS = 55_000;

export async function handler() {
  const endpoint = process.env.TRACKMCP_ALERT_EVALUATOR_URL;
  const token = process.env.TRACKMCP_ALERT_WORKER_TOKEN;
  if (!endpoint || !token) throw new Error("alert evaluator worker is not configured");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "x-trackmcp-worker-token": token, "content-type": "application/json" },
      body: "{}",
      redirect: "manual",
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`alert evaluator returned HTTP ${response.status}`);
    return { statusCode: response.status };
  } finally {
    clearTimeout(timeout);
  }
}
