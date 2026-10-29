#!/usr/bin/env node

/**
 * Opt-in production first-ingest smoke for pilot readiness.
 *
 * Sends one bounded metadata-only event with an explicitly supplied disposable
 * connection key, then verifies key-status exposes the accepted-ingest
 * milestone. Reports contain statuses only; no key, event body, workspace ID,
 * or response payload is persisted.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import process from "node:process";
import { randomUUID } from "node:crypto";

const CONFIRMATION = "I_UNDERSTAND_FIRST_INGEST_SMOKE";
// The public edge applies a managed WAF rule to the default Node fetch
// fingerprint. Match the already-published SDK boundary so this smoke tests
// the same request class as customer SDK delivery, without sending secrets or
// customer-identifying data in the header.
const EDGE_USER_AGENT = "Mozilla/5.0";
const baseUrl = process.env.TRACKMCP_INGEST_SMOKE_BASE_URL || "";
const apiKey = process.env.TRACKMCP_INGEST_SMOKE_KEY || "";
const service = process.env.TRACKMCP_INGEST_SMOKE_SERVICE || "pilot-ingest-smoke";
const environment = process.env.TRACKMCP_INGEST_SMOKE_ENVIRONMENT || "production";
const reportPath = process.env.TRACKMCP_INGEST_SMOKE_REPORT || "/tmp/trackmcp-production-ingest-smoke.json";
const waitMs = Math.min(120_000, Math.max(5_000, Number(process.env.TRACKMCP_INGEST_SMOKE_WAIT_MS) || 45_000));

function fail(message) { throw new Error(message); }

function validate() {
  if (process.env.TRACKMCP_INGEST_SMOKE_CONFIRM !== CONFIRMATION) fail(`Refusing to run. Set TRACKMCP_INGEST_SMOKE_CONFIRM=${CONFIRMATION} explicitly.`);
  if (!baseUrl || !apiKey) fail("TRACKMCP_INGEST_SMOKE_BASE_URL and TRACKMCP_INGEST_SMOKE_KEY are required.");
  let parsed;
  try { parsed = new URL(baseUrl); } catch { fail("TRACKMCP_INGEST_SMOKE_BASE_URL must be an absolute URL."); }
  const trustedHost = parsed.hostname === "trackmcp.com" || parsed.hostname === "app.trackmcp.com" || parsed.hostname.endsWith(".awsapprunner.com");
  if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.search || parsed.hash || !trustedHost) fail("Base URL must be a trusted HTTPS origin without credentials, query, or fragment.");
  if (!/^[\w.-]{1,100}$/.test(service) || !/^[\w.-]{1,64}$/.test(environment)) fail("Service and environment labels are outside the bounded smoke format.");
}

function endpoint(path) { return new URL(path, `${baseUrl.replace(/\/$/, "")}/`); }

async function request(path, options = {}) {
  const response = await fetch(endpoint(path), {
    ...options,
    redirect: "manual",
    headers: { accept: "application/json", authorization: `Bearer ${apiKey}`, "user-agent": EDGE_USER_AGENT, ...(options.headers || {}) },
    signal: AbortSignal.timeout(15_000),
  });
  let body = {};
  try {
    const parsed = await response.json();
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) body = parsed;
  } catch { /* status-only evidence */ }
  return { status: response.status, body };
}

function eventBody() {
  return {
    events: [{
      schema_version: "1",
      observation_source: "server",
      event_id: `pilot-ingest-${randomUUID()}`,
      event_type: "tool_call",
      service,
      environment,
      mcp_method: "tools/call",
      tool_name: "trackmcp_pilot_smoke",
      transport: "streamable_http",
      success: true,
      started_at: new Date().toISOString(),
      duration_ms: 1,
      payload: { result: { ok: true } },
    }],
  };
}

async function waitForAcceptedIngest() {
  const deadline = Date.now() + waitMs;
  let lastStatus = null;
  while (Date.now() < deadline) {
    const result = await request("/api/v1/cli/key-status");
    lastStatus = result.status;
    if (result.status === 200 && result.body.accepted_telemetry === true) return result;
    await new Promise((resolve) => setTimeout(resolve, Math.min(5_000, Math.max(500, deadline - Date.now()))));
  }
  fail(`accepted ingest milestone was not visible before timeout (last HTTP status ${lastStatus ?? "none"})`);
}

async function waitForAnalyticsReadBack() {
  const deadline = Date.now() + waitMs;
  let lastStatus = null;
  while (Date.now() < deadline) {
    const result = await request("/api/v1/analytics?days=1");
    lastStatus = result.status;
    const services = Array.isArray(result.body.services) ? result.body.services.filter((value) => typeof value === "string") : [];
    if (result.status === 200 && services.includes(service) && Number(result.body.total_events) >= 1) return result;
    await new Promise((resolve) => setTimeout(resolve, Math.min(5_000, Math.max(500, deadline - Date.now()))));
  }
  fail(`analytics read-back was not visible before timeout (last HTTP status ${lastStatus ?? "none"})`);
}

async function main() {
  validate();
  const ingest = await request("/api/v1/ingest", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(eventBody()) });
  if (ingest.status !== 200 || ingest.body.accepted !== 1) fail(`first ingest expected HTTP 200 with one accepted event, received HTTP ${ingest.status}`);
  await waitForAcceptedIngest();
  await waitForAnalyticsReadBack();
  const report = {
    outcome: "passed",
    generated_at: new Date().toISOString(),
    base_url: new URL(baseUrl).origin,
    checks: [
      { label: "metadata-only first ingest accepted", status: ingest.status, accepted: 1 },
      { label: "key-status exposes accepted ingest milestone", status: 200, accepted_telemetry: true },
      { label: "analytics read-back exposes the accepted smoke event", status: 200, analytics_read_back: true },
    ],
    caveats: ["This smoke sends exactly one bounded event with the explicitly supplied disposable key.", "Keys, event IDs, workspace IDs, response bodies, and authorization material are never written to the report.", "Accepted ingestion and analytics read-back prove transport/read-model acceptance, not business-workflow completion."],
  };
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
  console.log(`Production first-ingest smoke passed: ${report.checks.length} checks. Redacted report: ${reportPath}`);
}

main().catch(async (error) => {
  const message = error instanceof Error ? error.message : "unknown error";
  console.error(`Production first-ingest smoke failed: ${message}`);
  try {
    await mkdir(dirname(reportPath), { recursive: true });
    await writeFile(reportPath, `${JSON.stringify({ outcome: "failed", generated_at: new Date().toISOString(), base_url: (() => { try { return new URL(baseUrl).origin; } catch { return null; } })(), failure: message, checks: [], caveats: ["Failure evidence is redacted; no credentials, event payload, or response body is persisted."] }, null, 2)}\n`, { mode: 0o600 });
  } catch { /* preserve the original failure */ }
  process.exitCode = 1;
});
