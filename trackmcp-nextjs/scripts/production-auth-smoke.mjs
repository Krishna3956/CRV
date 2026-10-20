#!/usr/bin/env node

/**
 * Read-only authenticated production smoke for the 100-customer pilot.
 *
 * This script deliberately requires two operator-supplied workspace keys and
 * workspace IDs. It verifies that key authentication wins over a conflicting
 * workspace query parameter and that both keys have usable service scope.
 * Secrets and response bodies are never written to the report.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const CONFIRM = "I_UNDERSTAND_PRODUCTION_AUTH_SMOKE";
const baseUrl = process.env.TRACKMCP_AUTH_SMOKE_BASE_URL || "";
const keyA = process.env.TRACKMCP_AUTH_SMOKE_KEY_A || "";
const keyB = process.env.TRACKMCP_AUTH_SMOKE_KEY_B || "";
const workspaceA = process.env.TRACKMCP_AUTH_SMOKE_WORKSPACE_A || "";
const workspaceB = process.env.TRACKMCP_AUTH_SMOKE_WORKSPACE_B || "";
const revokedKey = process.env.TRACKMCP_AUTH_SMOKE_REVOKED_KEY || "";
const reportPath = process.env.TRACKMCP_AUTH_SMOKE_REPORT || "/tmp/trackmcp-production-auth-smoke.json";

function fail(message) { throw new Error(message); }

function validate() {
  if (process.env.TRACKMCP_AUTH_SMOKE_CONFIRM !== CONFIRM) fail(`Refusing to run. Set TRACKMCP_AUTH_SMOKE_CONFIRM=${CONFIRM} explicitly.`);
  if (!baseUrl || !keyA || !keyB || !workspaceA || !workspaceB) fail("TRACKMCP_AUTH_SMOKE_BASE_URL, both keys, and both workspace IDs are required.");
  let parsed;
  try { parsed = new URL(baseUrl); } catch { fail("TRACKMCP_AUTH_SMOKE_BASE_URL must be an absolute URL."); }
  if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.search || parsed.hash) fail("Base URL must be HTTPS and contain no credentials, query, or fragment.");
  if (workspaceA === workspaceB) fail("Workspace A and B must be different for the negative authorization check.");
  for (const [label, value] of [["workspace A", workspaceA], ["workspace B", workspaceB]]) {
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(value)) fail(`${label} is outside the bounded workspace-ID format.`);
  }
}

function endpoint(path) { return new URL(path, `${baseUrl.replace(/\/$/, "")}/`); }

async function request(path, key, options = {}) {
  const response = await fetch(endpoint(path), {
    ...options,
    redirect: "manual",
    headers: { accept: "application/json", authorization: `Bearer ${key}`, ...(options.headers || {}) },
    signal: AbortSignal.timeout(15_000),
  });
  return response;
}

async function keyStatus(key, label) {
  const response = await request("/api/v1/cli/key-status", key);
  if (response.status !== 200) fail(`${label} key-status expected HTTP 200, received HTTP ${response.status}`);
  let body = {};
  try {
    const parsed = await response.json();
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) body = parsed;
  } catch { fail(`${label} key-status did not return JSON.`); }
  if (body.workspace_available !== true || body.service_available !== true) fail(`${label} key-status does not report an available workspace and service.`);
  return { label: `${label} key-status`, status: response.status, workspace_available: true, service_available: true };
}

async function verifyKeyScope(key, keyLabel, expectedWorkspace, conflictingWorkspace) {
  const path = `/api/v2/setup?workspace_id=${encodeURIComponent(conflictingWorkspace)}`;
  const response = await request(path, key);
  if (response.status !== 200) fail(`${keyLabel} setup scope check expected HTTP 200, received HTTP ${response.status}`);
  let body = {};
  try {
    const parsed = await response.json();
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) body = parsed;
  } catch { fail(`${keyLabel} setup scope check did not return JSON.`); }
  const actual = body.setup && typeof body.setup === "object" ? body.setup.workspace_id : null;
  if (actual !== expectedWorkspace) fail(`${keyLabel} key scope did not remain bound to its workspace.`);
  if (actual === conflictingWorkspace) fail(`${keyLabel} key scope followed a conflicting workspace query.`);
  return { label: `${keyLabel} key scope ignores conflicting workspace query`, status: response.status, workspace_scope_verified: true };
}

const founderOsReadModels = [
  "/api/v2/overview",
  "/api/v2/people",
  "/api/v2/tools",
  "/api/v2/resources",
  "/api/v2/prompts",
  "/api/v2/journeys",
  "/api/v2/outcomes",
  "/api/v2/reliability",
  "/api/v2/catalogs",
  "/api/v2/tasks",
  "/api/v2/data-trust",
];

async function verifyFounderOsReadModels(key, keyLabel) {
  const checks = [];
  for (const path of founderOsReadModels) {
    const response = await request(`${path}?days=30`, key);
    if (response.status !== 200) fail(`${keyLabel} ${path} expected HTTP 200, received HTTP ${response.status}`);
    let body = {};
    try {
      const parsed = await response.json();
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) body = parsed;
    } catch {
      fail(`${keyLabel} ${path} did not return JSON.`);
    }
    const scope = body.scope && typeof body.scope === "object" ? body.scope : null;
    if (scope?.type !== "workspace" || scope?.value !== "authenticated") {
      fail(`${keyLabel} ${path} did not return an authenticated workspace envelope.`);
    }
    checks.push({ label: `${keyLabel} ${path} authenticated read model`, status: response.status, workspace_scope_verified: true });
  }
  return checks;
}

async function verifyApiKeyActionQueueBoundary(key, keyLabel) {
  const response = await request("/api/v2/action-queue", key);
  if (response.status !== 403) fail(`${keyLabel} action queue expected API-key denial HTTP 403, received HTTP ${response.status}`);
  return { label: `${keyLabel} action queue API-key denial`, status: response.status, human_session_required: true };
}

async function main() {
  validate();
  const checks = [];
  checks.push(await keyStatus(keyA, "workspace A"));
  checks.push(await keyStatus(keyB, "workspace B"));
  checks.push(await verifyKeyScope(keyA, "workspace A", workspaceA, workspaceB));
  checks.push(await verifyKeyScope(keyB, "workspace B", workspaceB, workspaceA));
  checks.push(...await verifyFounderOsReadModels(keyA, "workspace A"));
  checks.push(...await verifyFounderOsReadModels(keyB, "workspace B"));
  checks.push(await verifyApiKeyActionQueueBoundary(keyA, "workspace A"));
  checks.push(await verifyApiKeyActionQueueBoundary(keyB, "workspace B"));
  if (revokedKey) {
    const response = await request("/api/v1/cli/key-status", revokedKey);
    if (![401, 403].includes(response.status)) fail(`revoked key expected HTTP 401/403, received HTTP ${response.status}`);
    checks.push({ label: "revoked key negative auth", status: response.status });
  }
  const report = {
    generated_at: new Date().toISOString(),
    base_url: new URL(baseUrl).origin,
    checks,
    caveats: [
      "Read-only authenticated scope checks; no key creation, rotation, revocation, ingest, or dashboard mutation is performed.",
      "Keys, workspace IDs, response bodies, and authorization material are never written to this report.",
      "A passing scope check does not replace the Supabase RLS postflight or a separate key lifecycle smoke.",
    ],
  };
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, JSON.stringify(report, null, 2) + "\n", { mode: 0o600 });
  console.log(`Production authenticated scope smoke passed: ${checks.length} checks. Redacted report: ${reportPath}`);
}

main().catch((error) => { console.error(`Production authenticated scope smoke failed: ${error instanceof Error ? error.message : "unknown error"}`); process.exitCode = 1; });
