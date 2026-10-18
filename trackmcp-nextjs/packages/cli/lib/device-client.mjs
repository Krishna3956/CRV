const DEFAULT_API_BASE_URL = "https://app.trackmcp.com";
const DEFAULT_INGEST_URL = "https://trackmcp.com/api/v1/ingest";
const MAX_JSON_BYTES = 64 * 1024;
const MAX_INTERVAL_SECONDS = 30;

export const DEVICE_TERMINAL_STATUSES = new Set(["approved", "denied", "expired", "cancelled"]);

function boundedString(value, maximum = 512) {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maximum ? value.trim() : undefined;
}

function safeVerificationUrl(value) {
  const text = boundedString(value, 2048);
  if (!text) throw new Error("TrackMCP returned an invalid verification URL.");
  let url;
  try {
    url = new URL(text);
  } catch {
    throw new Error("TrackMCP returned an invalid verification URL.");
  }
  if (!(["https:", "http:"].includes(url.protocol)) || url.username || url.password) throw new Error("TrackMCP returned an invalid verification URL.");
  return url.toString();
}

function interval(value, fallback = 5) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(MAX_INTERVAL_SECONDS, Math.max(1, Math.ceil(parsed))) : fallback;
}

function cleanError(status, operation) {
  const suffix = typeof status === "number" ? ` (HTTP ${status})` : "";
  return new Error(`TrackMCP ${operation} failed${suffix}. Try again or check your network connection.`);
}

async function readJson(response) {
  const contentLength = Number(response.headers?.get?.("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_JSON_BYTES) throw cleanError(response.status, "response");
  const text = await response.text();
  if (text.length > MAX_JSON_BYTES) throw cleanError(response.status, "response");
  if (!text) return {};
  try {
    const value = JSON.parse(text);
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

export function createDeviceClient({
  apiBaseUrl = process.env.TRACKMCP_API_URL || DEFAULT_API_BASE_URL,
  ingestUrl = process.env.TRACKMCP_INGEST_URL || DEFAULT_INGEST_URL,
  fetchImpl = globalThis.fetch,
  clientVersion = "0.1.0",
  platform = `${process.platform}-${process.arch}`,
  packageManager = "npm",
  sdkPackage = "@trackmcp/sdk",
} = {}) {
  if (typeof fetchImpl !== "function") throw new Error("A fetch implementation is required.");
  const base = new URL(apiBaseUrl);
  if (!["https:", "http:"].includes(base.protocol)) throw new Error("TrackMCP API URL must use HTTP(S).");
  const endpoint = (path) => new URL(path, base).toString();

  const requestJson = async (path, init = {}) => {
    let response;
    try {
      response = await fetchImpl(endpoint(path), {
        ...init,
        headers: { accept: "application/json", ...(init.body ? { "content-type": "application/json" } : {}), ...(init.headers || {}) },
      });
    } catch {
      throw cleanError(undefined, path.includes("poll") ? "device polling" : "device authorization");
    }
    const body = await readJson(response);
    if (!response.ok) throw cleanError(response.status, path.includes("poll") ? "device polling" : path.includes("redeem") ? "device redemption" : "device authorization");
    return body;
  };

  return {
    async startSession() {
      const body = await requestJson("/api/v1/cli/device/sessions", {
        method: "POST",
        body: JSON.stringify({ client_version: clientVersion, platform, package_manager: packageManager, sdk_package: sdkPackage }),
      });
      const deviceCode = boundedString(body.device_code, 1024);
      const userCode = boundedString(body.user_code, 128);
      if (!deviceCode || !userCode) throw new Error("TrackMCP returned an incomplete device session.");
      return {
        deviceCode,
        userCode,
        verificationUri: safeVerificationUrl(body.verification_uri),
        verificationUriComplete: body.verification_uri_complete ? safeVerificationUrl(body.verification_uri_complete) : undefined,
        expiresIn: Math.min(3600, Math.max(1, Number(body.expires_in) || 600)),
        interval: interval(body.interval),
      };
    },
    async poll(deviceCode) {
      if (!boundedString(deviceCode, 1024)) throw new Error("TrackMCP device session is unavailable.");
      const body = await requestJson("/api/v1/cli/device/sessions/poll", { method: "POST", body: JSON.stringify({ device_code: deviceCode }) });
      const status = boundedString(body.status, 64);
      if (!status) throw new Error("TrackMCP returned an invalid device status.");
      if (status === "slow_down" || status === "authorization_pending") return { status, interval: interval(body.interval) };
      if (status === "approved") return { status };
      if (status === "denied") return { status, reasonCategory: boundedString(body.reason_category, 64) || "user_denied" };
      if (status === "expired" || status === "cancelled") return { status };
      throw new Error("TrackMCP returned an unknown device status.");
    },
    async redeem(deviceCode, keyName) {
      if (!boundedString(deviceCode, 1024)) throw new Error("TrackMCP device session is unavailable.");
      const body = await requestJson("/api/v1/cli/device/sessions/redeem", { method: "POST", body: JSON.stringify({ device_code: deviceCode, ...(boundedString(keyName, 80) ? { key_name: boundedString(keyName, 80) } : {}) }) });
      const apiKey = boundedString(body.api_key, 512);
      if (!apiKey || !/^tmcp_[A-Za-z0-9_-]{20,}$/.test(apiKey)) {
        if (body.status === "already_redeemed") return { status: "already_redeemed" };
        throw new Error("TrackMCP returned an invalid key result.");
      }
      return { status: "approved", apiKey, workspace: body.workspace && typeof body.workspace === "object" ? { id: boundedString(body.workspace.id, 128), name: boundedString(body.workspace.name, 128), slug: boundedString(body.workspace.slug, 128) } : undefined };
    },
    async keyStatus(apiKey) {
      if (!/^tmcp_[A-Za-z0-9_-]{20,}$/.test(String(apiKey || ""))) return { category: "malformed" };
      let response;
      try {
        response = await fetchImpl(endpoint("/api/v1/cli/key-status"), { method: "GET", headers: { accept: "application/json", authorization: `Bearer ${apiKey}` } });
      } catch {
        return { category: "network_error" };
      }
      const body = await readJson(response).catch(() => ({}));
      if (response.ok) {
        const status = boundedString(body.status, 64) || "valid";
        const accepted = body.accepted_telemetry === true || body.first_event_accepted === true || body.accepted_event === true;
        return { category: accepted ? "accepted_telemetry" : status === "revoked" ? "revoked" : status === "permission_denied" ? "permission_denied" : "no_accepted_telemetry", status, acceptedTelemetry: accepted };
      }
      if (response.status === 401) return { category: "unauthorized" };
      if (response.status === 403) return { category: "permission_denied" };
      if (response.status === 429 || response.status >= 500) return { category: "retryable" };
      return { category: "unknown" };
    },
    async ingestReachability() {
      try {
        const response = await fetchImpl(ingestUrl, { method: "HEAD" });
        return { reachable: true, status: response.status };
      } catch {
        return { reachable: false };
      }
    },
  };
}

export async function pollDeviceSession(client, session, { sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)), now = () => Date.now(), maxWaitMs = Math.min(600_000, Math.max(1_000, session.expiresIn * 1000)), signal } = {}) {
  const deadline = now() + maxWaitMs;
  let waitSeconds = interval(session.interval);
  while (now() < deadline) {
    if (signal?.aborted) return { status: "cancelled" };
    await sleep(Math.min(waitSeconds * 1000, Math.max(0, deadline - now())));
    if (signal?.aborted) return { status: "cancelled" };
    if (now() >= deadline) break;
    const result = await client.poll(session.deviceCode);
    if (result.interval) waitSeconds = interval(result.interval, waitSeconds);
    if (DEVICE_TERMINAL_STATUSES.has(result.status)) return result;
  }
  return { status: "timeout" };
}

export function createRedeemer(client) {
  let redeemed = false;
  return async (deviceCode, keyName) => {
    if (redeemed) return { status: "already_redeemed" };
    redeemed = true;
    return client.redeem(deviceCode, keyName);
  };
}

export { DEFAULT_API_BASE_URL, DEFAULT_INGEST_URL };
