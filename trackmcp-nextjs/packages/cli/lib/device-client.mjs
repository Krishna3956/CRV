import { randomBytes } from "node:crypto";

const DEFAULT_API_BASE_URL = "https://app.trackmcp.com";
const DEFAULT_INGEST_URL = "https://trackmcp.com/api/v1/ingest";
const MAX_JSON_BYTES = 64 * 1024;
const MAX_INTERVAL_SECONDS = 30;
const MAX_RETRY_AFTER_SECONDS = 60;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY_MS = 1000;
const MAX_RETRY_DELAY_MS = 10_000;
const RETRYABLE_HTTP_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

export const DEVICE_TERMINAL_STATUSES = new Set(["approved", "denied", "expired", "cancelled"]);

function boundedString(value, maximum = 512) {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maximum ? value.trim() : undefined;
}

function safeVerificationUrl(value, { allowHttp = false } = {}) {
  const text = boundedString(value, 2048);
  if (!text) throw new Error("TrackMCP returned an invalid verification URL.");
  let url;
  try {
    url = new URL(text);
  } catch {
    throw new Error("TrackMCP returned an invalid verification URL.");
  }
  if (allowHttp && url.protocol === "http:" && !url.username && !url.password) return url.toString();
  if (!allowHttp && url.protocol !== "https:") throw new Error("TrackMCP returned an invalid verification URL.");
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

function createRedemptionId() {
  return randomBytes(16).toString("hex");
}

function retryAfterSeconds(response, fallback = 1) {
  const value = response?.headers?.get?.("retry-after");
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed >= 0) return Math.min(MAX_RETRY_AFTER_SECONDS, Math.max(1, Math.ceil(parsed)));
  return Math.min(MAX_RETRY_AFTER_SECONDS, Math.max(1, Math.ceil(fallback)));
}

function retryDelayMs(attempt, response) {
  if (response?.status === 429) return retryAfterSeconds(response, DEFAULT_RETRY_DELAY_MS / 1000) * 1000;
  return Math.min(MAX_RETRY_DELAY_MS, DEFAULT_RETRY_DELAY_MS * (2 ** attempt));
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
  allowInsecureVerificationUrl = false,
  retrySleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
  maxRetries = DEFAULT_MAX_RETRIES,
} = {}) {
  if (typeof fetchImpl !== "function") throw new Error("A fetch implementation is required.");
  const base = new URL(apiBaseUrl);
  if (!["https:", "http:"].includes(base.protocol)) throw new Error("TrackMCP API URL must use HTTP(S).");
  const endpoint = (path) => new URL(path, base).toString();

  const requestJson = async (path, init = {}, { retry = false } = {}) => {
    const attempts = retry ? Math.max(0, Math.min(5, Number(maxRetries) || DEFAULT_MAX_RETRIES)) : 0;
    for (let attempt = 0; attempt <= attempts; attempt += 1) {
      let response;
      try {
        response = await fetchImpl(endpoint(path), {
          ...init,
          headers: { accept: "application/json", ...(init.body ? { "content-type": "application/json" } : {}), ...(init.headers || {}) },
        });
      } catch {
        if (attempt < attempts) {
          await retrySleep(retryDelayMs(attempt));
          continue;
        }
        return { ok: false, status: 0, body: {}, networkError: true };
      }
      const body = await readJson(response);
      if (response.ok || !retry || !RETRYABLE_HTTP_STATUSES.has(response.status) || attempt >= attempts) {
        return { ok: response.ok, status: response.status, body, response };
      }
      await retrySleep(retryDelayMs(attempt, response));
    }
    return { ok: false, status: 0, body: {}, networkError: true };
  };

  const redemptionIds = new Map();

  return {
    async startSession() {
      const result = await requestJson("/api/v1/cli/device/sessions", {
        method: "POST",
        body: JSON.stringify({ client_version: clientVersion, platform, package_manager: packageManager, sdk_package: sdkPackage }),
      });
      if (!result.ok) throw cleanError(result.status, "device authorization");
      const body = result.body;
      const deviceCode = boundedString(body.device_code, 1024);
      const userCode = boundedString(body.user_code, 128);
      if (!deviceCode || !userCode) throw new Error("TrackMCP returned an incomplete device session.");
      return {
        deviceCode,
        userCode,
        verificationUri: safeVerificationUrl(body.verification_uri, { allowHttp: allowInsecureVerificationUrl }),
        verificationUriComplete: body.verification_uri_complete ? safeVerificationUrl(body.verification_uri_complete, { allowHttp: allowInsecureVerificationUrl }) : undefined,
        expiresIn: Math.min(3600, Math.max(1, Number(body.expires_in) || 600)),
        interval: interval(body.interval),
      };
    },
    async poll(deviceCode) {
      if (!boundedString(deviceCode, 1024)) throw new Error("TrackMCP device session is unavailable.");
      const result = await requestJson("/api/v1/cli/device/sessions/poll", { method: "POST", body: JSON.stringify({ device_code: deviceCode }) }, { retry: true });
      if (result.networkError) return { status: "retryable", retryAfter: MAX_RETRY_AFTER_SECONDS };
      const body = result.body;
      if (!result.ok) {
        if (body.status === "expired") return { status: "expired" };
        if (body.status === "denied") return { status: "denied", reasonCategory: boundedString(body.reason_category, 64) || "user_denied" };
        if (result.status === 429) return { status: "retryable", retryAfter: retryAfterSeconds(result.response, MAX_RETRY_AFTER_SECONDS) };
        throw cleanError(result.status, "device polling");
      }
      const status = boundedString(body.status, 64);
      if (!status) throw new Error("TrackMCP returned an invalid device status.");
      if (status === "slow_down" || status === "authorization_pending") return { status, interval: interval(body.interval) };
      if (status === "approved") return { status };
      if (status === "denied") return { status, reasonCategory: boundedString(body.reason_category, 64) || "user_denied" };
      if (status === "expired" || status === "cancelled") return { status };
      throw new Error("TrackMCP returned an unknown device status.");
    },
    async redeem(deviceCode, keyName, options = {}) {
      if (!boundedString(deviceCode, 1024)) throw new Error("TrackMCP device session is unavailable.");
      const redemptionId = typeof options === "string" ? options : options.redemptionId;
      const id = boundedString(redemptionId, 128) || redemptionIds.get(deviceCode) || createRedemptionId();
      redemptionIds.set(deviceCode, id);
      const result = await requestJson("/api/v1/cli/device/sessions/redeem", { method: "POST", body: JSON.stringify({ device_code: deviceCode, redemption_id: id, ...(boundedString(keyName, 80) ? { key_name: boundedString(keyName, 80) } : {}) }) }, { retry: true });
      if (result.networkError) return { status: "retryable", retryAfter: MAX_RETRY_AFTER_SECONDS };
      const body = result.body;
      if (!result.ok) {
        if (body.status === "expired") return { status: "expired" };
        if (body.status === "denied") return { status: "denied" };
        if (body.status === "already_redeemed") return { status: "already_redeemed" };
        if (result.status === 429) return { status: "retryable", retryAfter: retryAfterSeconds(result.response, MAX_RETRY_AFTER_SECONDS) };
        throw cleanError(result.status, "device redemption");
      }
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
      const details = {
        status: boundedString(body.status, 64),
        workspaceAvailable: body.workspace_available === true,
        serviceAvailable: body.service_available === true,
      };
      if (response.ok) {
        const status = details.status || "valid";
        const accepted = body.accepted_telemetry === true || body.first_event_accepted === true || body.accepted_event === true;
        return { category: accepted ? "accepted_telemetry" : status === "revoked" ? "revoked" : status === "permission_denied" ? "permission_denied" : "no_accepted_telemetry", ...details, acceptedTelemetry: accepted };
      }
      if (response.status === 401 && (details.status === "invalid" || details.status === "revoked")) return { category: details.status, ...details };
      if (response.status === 401) return { category: "unauthorized", ...details };
      if (response.status === 403) return { category: "permission_denied", ...details };
      if (response.status === 429 || response.status >= 500) return { category: "retryable", ...details };
      return { category: "unknown", ...details };
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
    let result;
    try {
      result = await client.poll(session.deviceCode);
    } catch {
      result = { status: "retryable", retryAfter: Math.min(MAX_RETRY_AFTER_SECONDS, Math.max(1, waitSeconds * 2)) };
    }
    if (result.status === "retryable") {
      waitSeconds = Math.min(MAX_RETRY_AFTER_SECONDS, Math.max(1, Number(result.retryAfter) || waitSeconds * 2));
      continue;
    }
    if (result.interval) waitSeconds = interval(result.interval, waitSeconds);
    if (DEVICE_TERMINAL_STATUSES.has(result.status)) return result;
  }
  return { status: "timeout" };
}

export function createRedeemer(client) {
  let redeemed = false;
  const redemptionId = createRedemptionId();
  return async (deviceCode, keyName) => {
    if (redeemed) return { status: "already_redeemed" };
    const result = await client.redeem(deviceCode, keyName, { redemptionId });
    if (["approved", "already_redeemed", "expired", "denied"].includes(result.status)) redeemed = true;
    return result;
  };
}

export { DEFAULT_API_BASE_URL, DEFAULT_INGEST_URL };
