#!/usr/bin/env node

/**
 * Explicit production CLI device-flow smoke.
 *
 * This is inert until the operator supplies a disposable signed-in browser
 * cookie, a workspace ID, and both confirmation flags. It creates one
 * short-lived CLI connection key, proves first-event acceptance, then revokes
 * that key before producing a redacted report. Cookies, device codes, keys,
 * workspace identifiers, event bodies, and response bodies never print or
 * enter the report.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { randomBytes, randomUUID } from "node:crypto";

const CONFIRMATION = "I_UNDERSTAND_DEVICE_FLOW_SMOKE";
const baseUrl = process.env.TRACKMCP_DEVICE_FLOW_BASE_URL || "";
const cookie = process.env.TRACKMCP_DEVICE_FLOW_COOKIE || "";
const workspaceId = process.env.TRACKMCP_DEVICE_FLOW_WORKSPACE_ID || "";
const reportPath = process.env.TRACKMCP_DEVICE_FLOW_REPORT || "/tmp/trackmcp-device-flow-smoke.json";

function fail(message) { throw new Error(message); }

function validate() {
  if (process.env.TRACKMCP_DEVICE_FLOW_CONFIRM !== CONFIRMATION) fail(`Refusing to run. Set TRACKMCP_DEVICE_FLOW_CONFIRM=${CONFIRMATION} explicitly.`);
  if (process.env.TRACKMCP_DEVICE_FLOW_ALLOW_WRITE !== "true") fail("Refusing to run. Set TRACKMCP_DEVICE_FLOW_ALLOW_WRITE=true explicitly.");
  if (!baseUrl || !cookie || !workspaceId) fail("TRACKMCP_DEVICE_FLOW_BASE_URL, COOKIE, and WORKSPACE_ID are required.");
  let parsed;
  try { parsed = new URL(baseUrl); } catch { fail("TRACKMCP_DEVICE_FLOW_BASE_URL must be an absolute URL."); }
  const trustedHost = parsed.hostname === "trackmcp.com" || parsed.hostname === "app.trackmcp.com" || parsed.hostname.endsWith(".awsapprunner.com");
  if (parsed.protocol !== "https:" || !trustedHost || parsed.username || parsed.password || parsed.search || parsed.hash) fail("Device-flow smoke requires a trusted credential-free HTTPS base URL.");
  if (!/^[0-9a-f-]{36}$/i.test(workspaceId)) fail("TRACKMCP_DEVICE_FLOW_WORKSPACE_ID is outside the bounded UUID format.");
  if (cookie.length > 16_384) fail("TRACKMCP_DEVICE_FLOW_COOKIE exceeds the bounded cookie length.");
}

function endpoint(path) { return new URL(path, `${baseUrl.replace(/\/$/, "")}/`); }

async function request(path, options = {}) {
  const response = await fetch(endpoint(path), {
    ...options,
    redirect: "manual",
    headers: { accept: "application/json", "content-type": "application/json", "user-agent": "TrackMCP device-flow-smoke", ...(options.headers || {}) },
    signal: AbortSignal.timeout(15_000),
  });
  let body = {};
  try {
    const parsed = await response.json();
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) body = parsed;
  } catch { /* status-only evidence */ }
  return { status: response.status, body };
}

function assertStatus(result, expected, label) {
  if (result.status !== expected) fail(`${label}: expected HTTP ${expected}, received HTTP ${result.status}`);
}

async function main() {
  validate();
  const authHeaders = { cookie };
  const checks = [];
  const keyName = `device-flow-smoke-${randomBytes(8).toString("hex")}`;
  let replacementKey = "";
  let createdKeyId = "";
  try {
    const start = await request("/api/v1/cli/device/sessions", {
      method: "POST",
      body: JSON.stringify({ client_version: "production-device-flow-smoke", platform: "uat", package_manager: "npm", sdk_package: "@trackmcp/sdk" }),
    });
    assertStatus(start, 201, "start device session");
    const deviceCode = typeof start.body.device_code === "string" ? start.body.device_code : "";
    const userCode = typeof start.body.user_code === "string" ? start.body.user_code : "";
    if (!deviceCode || !userCode) fail("start device session: bounded device material was missing");
    checks.push({ label: "start device session", status: start.status });

    const approve = await request("/api/v1/cli/device/sessions/approve", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ user_code: userCode, workspace_id: workspaceId }),
    });
    assertStatus(approve, 200, "approve device session");
    if (approve.body.status !== "approved") fail("approve device session: status was not approved");
    checks.push({ label: "approve device session", status: approve.status });

    const poll = await request("/api/v1/cli/device/sessions/poll", {
      method: "POST",
      body: JSON.stringify({ device_code: deviceCode }),
    });
    assertStatus(poll, 200, "poll approved device session");
    if (poll.body.status !== "approved") fail("poll approved device session: status was not approved");
    checks.push({ label: "poll approved device session", status: poll.status });

    const redeem = await request("/api/v1/cli/device/sessions/redeem", {
      method: "POST",
      body: JSON.stringify({ device_code: deviceCode, redemption_id: randomBytes(16).toString("hex"), key_name: keyName }),
    });
    assertStatus(redeem, 201, "redeem device session");
    replacementKey = typeof redeem.body.api_key === "string" ? redeem.body.api_key : "";
    if (!replacementKey || redeem.body.workspace?.id !== workspaceId) fail("redeem device session: bounded key/workspace result was missing");
    checks.push({ label: "redeem device session", status: redeem.status, secret_returned: true });

    const keyStatus = await request("/api/v1/cli/key-status", { headers: { authorization: `Bearer ${replacementKey}` } });
    assertStatus(keyStatus, 200, "redeemed key status");
    if (keyStatus.body.workspace_available !== true || keyStatus.body.service_available !== true) fail("redeemed key status: workspace or service unavailable");
    checks.push({ label: "redeemed key status", status: keyStatus.status, workspace_available: true, service_available: true });

    const ingest = await request("/api/v1/ingest", {
      method: "POST",
      headers: { authorization: `Bearer ${replacementKey}` },
      body: JSON.stringify({ events: [{
        schema_version: "1",
        observation_source: "server",
        event_id: `device-flow-smoke-${randomUUID()}`,
        event_type: "tool_call",
        service: "device-flow-smoke",
        environment: "test",
        mcp_method: "tools/call",
        tool_name: "trackmcp_device_flow_smoke",
        transport: "stdio",
        success: true,
        started_at: new Date().toISOString(),
        duration_ms: 1,
        payload: { result: { ok: true } },
      }] }),
    });
    assertStatus(ingest, 200, "first device-flow event");
    if (ingest.body.accepted !== 1) fail("first device-flow event: event was not accepted");
    checks.push({ label: "first device-flow event", status: ingest.status, accepted: 1 });

    const milestone = await request("/api/v1/cli/key-status", { headers: { authorization: `Bearer ${replacementKey}` } });
    assertStatus(milestone, 200, "accepted-ingest milestone");
    if (milestone.body.accepted_telemetry !== true) fail("accepted-ingest milestone: accepted_telemetry was not true");
    checks.push({ label: "accepted-ingest milestone", status: milestone.status, accepted_telemetry: true });

    const listed = await request(`/api/v1/account/workspace?workspace_id=${encodeURIComponent(workspaceId)}`, { headers: authHeaders });
    assertStatus(listed, 200, "list device-flow workspace keys");
    const createdKey = Array.isArray(listed.body.keys) ? listed.body.keys.find((key) => key?.name === keyName && key?.revoked_at === null) : null;
    createdKeyId = typeof createdKey?.id === "string" ? createdKey.id : "";
    if (!createdKeyId) fail("list device-flow workspace keys: disposable key id was not found");

    const revoke = await request(`/api/v1/account/keys/${encodeURIComponent(createdKeyId)}?workspace_id=${encodeURIComponent(workspaceId)}`, { method: "DELETE", headers: authHeaders });
    assertStatus(revoke, 200, "revoke device-flow key");
    checks.push({ label: "revoke device-flow key", status: revoke.status });
    createdKeyId = "";

    const rejected = await request("/api/v1/cli/key-status", { headers: { authorization: `Bearer ${replacementKey}` } });
    if (![401, 403].includes(rejected.status)) fail(`rejected device-flow key: expected HTTP 401/403, received HTTP ${rejected.status}`);
    checks.push({ label: "rejected device-flow key", status: rejected.status });
  } finally {
    // If any step after redemption fails, revoke only the uniquely named key
    // created by this run. Never guess at or mutate another workspace key.
    if (replacementKey && !createdKeyId) {
      try {
        const listed = await request(`/api/v1/account/workspace?workspace_id=${encodeURIComponent(workspaceId)}`, { headers: authHeaders });
        const createdKey = Array.isArray(listed.body.keys) ? listed.body.keys.find((key) => key?.name === keyName && key?.revoked_at === null) : null;
        createdKeyId = typeof createdKey?.id === "string" ? createdKey.id : "";
      } catch { /* preserve the original result */ }
    }
    if (createdKeyId) {
      try { await request(`/api/v1/account/keys/${encodeURIComponent(createdKeyId)}?workspace_id=${encodeURIComponent(workspaceId)}`, { method: "DELETE", headers: authHeaders }); } catch { /* best effort cleanup */ }
    }
  }

  const report = {
    outcome: "passed",
    generated_at: new Date().toISOString(),
    base_url: new URL(baseUrl).origin,
    checks_total: checks.length,
    checks_executed: checks.length,
    checks_skipped: 0,
    checks,
    caveats: [
      "This smoke mutates only the explicitly supplied disposable workspace session and the uniquely named key created by this run.",
      "No cookie, device code, key, event ID, workspace ID, response body, or credential is written to the report.",
      "Accepted ingestion proves the device activation and transport boundary, not business-workflow completion.",
    ],
  };
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
  console.log(`Production device-flow smoke passed: ${checks.length} checks. Redacted report: ${reportPath}`);
}

main().catch(async (error) => {
  const message = error instanceof Error ? error.message : "unknown error";
  const report = { outcome: "failed", generated_at: new Date().toISOString(), base_url: (() => { try { return new URL(baseUrl).origin; } catch { return null; } })(), failure: message, caveats: ["Failure evidence is redacted; no cookie, device code, key, workspace ID, event body, or response body is persisted."] };
  try { await mkdir(dirname(reportPath), { recursive: true }); await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 }); } catch { /* preserve original failure */ }
  console.error(`Production device-flow smoke failed: ${message}`);
  process.exitCode = 1;
});
