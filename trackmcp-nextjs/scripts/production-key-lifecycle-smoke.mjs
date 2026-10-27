#!/usr/bin/env node

/**
 * Explicit production key lifecycle smoke. This is inert unless the operator
 * supplies the confirmation and write opt-ins. Reports contain only statuses
 * and booleans; cookies, keys, workspace IDs, and response bodies never print.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import process from "node:process";

const CONFIRMATION = "I_UNDERSTAND_KEY_LIFECYCLE_SMOKE";
const baseUrl = process.env.TRACKMCP_LIFECYCLE_BASE_URL || "";
const cookie = process.env.TRACKMCP_LIFECYCLE_COOKIE || "";
const workspaceId = process.env.TRACKMCP_LIFECYCLE_WORKSPACE_ID || "";
const keyId = process.env.TRACKMCP_LIFECYCLE_KEY_ID || "";
const oldKey = process.env.TRACKMCP_LIFECYCLE_KEY || "";
const reportPath = process.env.TRACKMCP_LIFECYCLE_REPORT || "/tmp/trackmcp-key-lifecycle-smoke.json";

function fail(message) { throw new Error(message); }

function validate() {
  if (process.env.TRACKMCP_KEY_LIFECYCLE_CONFIRM !== CONFIRMATION) fail(`Refusing to run. Set TRACKMCP_KEY_LIFECYCLE_CONFIRM=${CONFIRMATION} explicitly.`);
  if (process.env.TRACKMCP_LIFECYCLE_ALLOW_WRITE !== "true") fail("Refusing to run. Set TRACKMCP_LIFECYCLE_ALLOW_WRITE=true explicitly.");
  if (!baseUrl || !cookie || !workspaceId || !keyId || !oldKey) fail("TRACKMCP_LIFECYCLE_BASE_URL, COOKIE, WORKSPACE_ID, KEY_ID, and KEY are required.");
  let parsed;
  try { parsed = new URL(baseUrl); } catch { fail("TRACKMCP_LIFECYCLE_BASE_URL must be an absolute URL."); }
  const trustedHost = parsed.hostname === "trackmcp.com" || parsed.hostname === "app.trackmcp.com" || parsed.hostname.endsWith(".awsapprunner.com");
  if (parsed.protocol !== "https:" || !trustedHost || parsed.username || parsed.password || parsed.search || parsed.hash) fail("Lifecycle smoke requires a trusted credential-free HTTPS base URL.");
}

function endpoint(path) { return new URL(path, `${baseUrl.replace(/\/$/, "")}/`); }

async function request(path, options = {}) {
  const response = await fetch(endpoint(path), {
    ...options,
    redirect: "manual",
    // This harness exercises the deployed web API, not a package release. Keep
    // the user-agent release-neutral so a historical package version cannot be
    // mistaken for the candidate being verified.
    headers: { accept: "application/json", "user-agent": "TrackMCP lifecycle-smoke", ...(options.headers || {}) },
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
  const checks = [];
  const authHeaders = { cookie };
  const rotate = await request(`/api/v1/account/keys/${encodeURIComponent(keyId)}/rotate?workspace_id=${encodeURIComponent(workspaceId)}`, { method: "POST", headers: authHeaders });
  assertStatus(rotate, 201, "rotate active key");
  const replacement = rotate.body.key;
  const replacementKey = typeof rotate.body.api_key === "string" ? rotate.body.api_key : "";
  const replacementId = replacement && typeof replacement.id === "string" ? replacement.id : "";
  if (!replacementKey || !replacementId) fail("rotate active key: response did not contain bounded replacement material");
  checks.push({ label: "rotate active key", status: rotate.status, replacement_secret_returned: true });

  const oldStatus = await request("/api/v1/cli/key-status", { headers: { authorization: `Bearer ${oldKey}` } });
  if (![401, 403].includes(oldStatus.status)) fail(`old key rejection: expected HTTP 401/403, received HTTP ${oldStatus.status}`);
  checks.push({ label: "old key rejected after rotation", status: oldStatus.status });

  const replacementStatus = await request("/api/v1/cli/key-status", { headers: { authorization: `Bearer ${replacementKey}` } });
  assertStatus(replacementStatus, 200, "replacement key accepted");
  checks.push({ label: "replacement key accepted", status: replacementStatus.status, workspace_available: replacementStatus.body.workspace_available === true, service_available: replacementStatus.body.service_available === true });

  const revoke = await request(`/api/v1/account/keys/${encodeURIComponent(replacementId)}?workspace_id=${encodeURIComponent(workspaceId)}`, { method: "DELETE", headers: authHeaders });
  assertStatus(revoke, 200, "revoke replacement key");
  checks.push({ label: "revoke replacement key", status: revoke.status });

  const revokedStatus = await request("/api/v1/cli/key-status", { headers: { authorization: `Bearer ${replacementKey}` } });
  if (![401, 403].includes(revokedStatus.status)) fail(`replacement key rejection: expected HTTP 401/403, received HTTP ${revokedStatus.status}`);
  checks.push({ label: "replacement key rejected after revoke", status: revokedStatus.status });

  const report = { outcome: "passed", generated_at: new Date().toISOString(), base_url: new URL(baseUrl).origin, checks_total: checks.length, checks_executed: checks.length, checks_skipped: 0, checks, caveats: ["This smoke mutates only the explicitly supplied disposable key and replacement key.", "No cookie, key, workspace ID, response body, or credential is written to the report."] };
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
  console.log(`Production key lifecycle smoke passed: ${checks.length} checks. Redacted report: ${reportPath}`);
}

main().catch((error) => { console.error(`Production key lifecycle smoke failed: ${error.message}`); process.exitCode = 1; });
