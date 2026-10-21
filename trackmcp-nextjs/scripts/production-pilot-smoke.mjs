#!/usr/bin/env node

/**
 * Explicit, evidence-producing smoke for the limited pilot.
 *
 * This script is intentionally inert unless the operator opts in with both
 * TRACKMCP_PRODUCTION_SMOKE_CONFIRM and (for writes) TRACKMCP_SMOKE_ALLOW_WRITE.
 * It never reads deploy files, AWS credentials, Supabase credentials, or the
 * local CLI key store. It never prints or writes a credential or event body.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import process from "node:process";

const confirmation = "I_UNDERSTAND_PRODUCTION_SMOKE";
const baseUrl = process.env.TRACKMCP_SMOKE_BASE_URL || "";
const key = process.env.TRACKMCP_SMOKE_KEY || "";
const revokedKey = process.env.TRACKMCP_SMOKE_REVOKED_KEY || "";
const allowWrite = process.env.TRACKMCP_SMOKE_ALLOW_WRITE === "true";
const requireAuth = process.env.TRACKMCP_SMOKE_REQUIRE_AUTH === "true";
const reportPath = process.env.TRACKMCP_SMOKE_REPORT || "/tmp/trackmcp-production-smoke.json";
const imageDigest = process.env.TRACKMCP_SMOKE_IMAGE_DIGEST || "not-supplied";

function fail(message) {
  throw new Error(message);
}

function validateOptIn() {
  if (process.env.TRACKMCP_PRODUCTION_SMOKE_CONFIRM !== confirmation) {
    fail(`Refusing to run. Set TRACKMCP_PRODUCTION_SMOKE_CONFIRM=${confirmation} explicitly.`);
  }
  if (!baseUrl) fail("TRACKMCP_SMOKE_BASE_URL is required.");
  let url;
  try { url = new URL(baseUrl); } catch { fail("TRACKMCP_SMOKE_BASE_URL must be an absolute URL."); }
  if (url.protocol !== "https:") fail("Production smoke requires an https base URL.");
  if (url.username || url.password || url.search || url.hash) fail("Base URL must not contain credentials, query parameters, or fragments.");
  if (allowWrite && !key) fail("TRACKMCP_SMOKE_KEY is required when TRACKMCP_SMOKE_ALLOW_WRITE=true.");
  if (requireAuth && !key) fail("TRACKMCP_SMOKE_KEY is required when TRACKMCP_SMOKE_REQUIRE_AUTH=true.");
}

function endpoint(path) { return new URL(path, `${baseUrl.replace(/\/$/, "")}/`); }

async function request(path, options = {}) {
  const response = await fetch(endpoint(path), {
    ...options,
    redirect: "manual",
    signal: AbortSignal.timeout(15_000),
  });
  return { status: response.status, headers: response.headers };
}

const requiredSecurityHeaders = {
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "x-frame-options": "SAMEORIGIN",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
};

function assertSecurityHeaders(headers, label) {
  for (const [name, expected] of Object.entries(requiredSecurityHeaders)) {
    if (headers.get(name) !== expected) fail(`${label}: missing or incorrect ${name} header`);
  }
}

async function keyStatusRequest(apiKey) {
  const response = await fetch(endpoint("/api/v1/cli/key-status"), {
    method: "GET",
    headers: { accept: "application/json", authorization: `Bearer ${apiKey}` },
    redirect: "manual",
    signal: AbortSignal.timeout(15_000),
  });
  let body = {};
  try {
    const parsed = await response.json();
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) body = parsed;
  } catch {
    // The evidence report records only the status code and bounded booleans.
  }
  return {
    status: response.status,
    acceptedTelemetry: body.accepted_telemetry === true || body.first_event_accepted === true,
    workspaceAvailable: body.workspace_available === true,
    serviceAvailable: body.service_available === true,
  };
}

async function expect(path, expected, options, label = path, { securityHeaders = false } = {}) {
  const response = await request(path, options);
  if (response.status !== expected) fail(`${label}: expected HTTP ${expected}, received HTTP ${response.status}`);
  if (securityHeaders) assertSecurityHeaders(response.headers, label);
  return { label, status: response.status };
}

// Public copy is part of the pilot's safety boundary. Verify the deployed
// document has the bounded wording, but retain only booleans in the report—
// never a page body or a customer-facing page snapshot.
async function expectPublicClaim(path, requiredText, prohibitedText, label) {
  const response = await fetch(endpoint(path), {
    redirect: "manual",
    signal: AbortSignal.timeout(15_000),
    headers: { accept: "text/html" },
  });
  if (response.status !== 200) fail(`${label}: expected HTTP 200, received HTTP ${response.status}`);
  assertSecurityHeaders(response.headers, label);
  const text = (await response.text()).replace(/\s+/g, " ");
  if (!text.includes(requiredText)) fail(`${label}: required bounded claim was not rendered`);
  if (prohibitedText && text.includes(prohibitedText)) fail(`${label}: prohibited overclaim was rendered`);
  return { label, status: response.status, bounded_claim_present: true, prohibited_overclaim_absent: true };
}

async function expectToolSitemap() {
  const response = await fetch(endpoint("/tool-sitemap.xml"), {
    redirect: "manual",
    signal: AbortSignal.timeout(15_000),
    headers: { accept: "application/xml,text/xml" },
  });
  if (response.status !== 200) fail(`tool sitemap index: expected HTTP 200, received HTTP ${response.status}`);
  const index = await response.text();
  if (!index.includes("<sitemapindex") || !index.includes("/tool-sitemap/0.xml")) fail("tool sitemap index: missing XML index or first shard");
  const shard = await fetch(endpoint("/tool-sitemap/0.xml"), {
    redirect: "manual",
    signal: AbortSignal.timeout(15_000),
    headers: { accept: "application/xml,text/xml" },
  });
  if (shard.status !== 200) fail(`tool sitemap first shard: expected HTTP 200, received HTTP ${shard.status}`);
  const xml = await shard.text();
  if (!xml.includes("<urlset") || !xml.includes("<loc>")) fail("tool sitemap first shard: missing URL entries");
  return { label: "tool sitemap index and first shard", status: 200, first_shard_has_urls: true };
}

async function registryChecks() {
  const checks = [];
  const npmPackage = process.env.TRACKMCP_EXPECTED_NPM_SDK || "@trackmcp/sdk@0.1.4";
  const cliPackage = process.env.TRACKMCP_EXPECTED_NPM_CLI || "@trackmcp/cli@0.1.4";
  const pythonPackage = process.env.TRACKMCP_EXPECTED_PYPI || "trackmcp@0.1.4";
  const expectedNpmIntegrity = {
    [npmPackage]: process.env.TRACKMCP_EXPECTED_NPM_SDK_INTEGRITY || "",
    [cliPackage]: process.env.TRACKMCP_EXPECTED_NPM_CLI_INTEGRITY || "",
  };
  for (const spec of [npmPackage, cliPackage]) {
    const at = spec.lastIndexOf("@");
    const name = spec.slice(0, at);
    const version = spec.slice(at + 1);
    const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}/${encodeURIComponent(version)}`, { signal: AbortSignal.timeout(15_000) });
    if (!response.ok) fail(`npm registry check failed for ${name}@${version}: HTTP ${response.status}`);
    const metadata = await response.json();
    if (metadata.name !== name || metadata.version !== version) fail(`npm registry metadata mismatch for ${name}@${version}`);
    const integrity = metadata.dist?.integrity || "";
    if (!/^sha512-[A-Za-z0-9+/=]+$/.test(integrity)) fail(`npm registry integrity missing for ${name}@${version}`);
    if (expectedNpmIntegrity[spec] && integrity !== expectedNpmIntegrity[spec]) fail(`npm registry integrity mismatch for ${name}@${version}`);
    const tarball = metadata.dist?.tarball || "";
    let tarballUrl;
    try { tarballUrl = new URL(tarball); } catch { fail(`npm registry tarball URL invalid for ${name}@${version}`); }
    if (tarballUrl.origin !== "https://registry.npmjs.org" || !tarballUrl.pathname.startsWith(`/${name}/`)) fail(`npm registry tarball origin mismatch for ${name}@${version}`);
    checks.push({ label: `npm ${name}@${version}`, status: response.status, integrity_present: true, tarball_origin_verified: true });
  }
  const at = pythonPackage.lastIndexOf("@");
  const name = pythonPackage.slice(0, at);
  const version = pythonPackage.slice(at + 1);
  const response = await fetch(`https://pypi.org/pypi/${encodeURIComponent(name)}/${encodeURIComponent(version)}/json`, { signal: AbortSignal.timeout(15_000) });
  if (!response.ok) fail(`PyPI registry check failed for ${name}==${version}: HTTP ${response.status}`);
  const metadata = await response.json();
  if (metadata.info?.name !== name || metadata.info?.version !== version) fail(`PyPI registry metadata mismatch for ${name}==${version}`);
  const files = Array.isArray(metadata.urls) ? metadata.urls : [];
  const wheel = files.find((file) => file.packagetype === "bdist_wheel");
  const sdist = files.find((file) => file.packagetype === "sdist");
  if (!wheel?.digests?.sha256 || !sdist?.digests?.sha256) fail(`PyPI checksums missing for ${name}==${version}`);
  const expectedWheel = process.env.TRACKMCP_EXPECTED_PYPI_WHEEL_SHA256 || "";
  const expectedSdist = process.env.TRACKMCP_EXPECTED_PYPI_SDIST_SHA256 || "";
  if (expectedWheel && wheel.digests.sha256 !== expectedWheel) fail(`PyPI wheel checksum mismatch for ${name}==${version}`);
  if (expectedSdist && sdist.digests.sha256 !== expectedSdist) fail(`PyPI sdist checksum mismatch for ${name}==${version}`);
  checks.push({ label: `PyPI ${name}==${version}`, status: response.status, wheel_sha256_present: true, sdist_sha256_present: true });
  return checks;
}

async function main() {
  validateOptIn();
  const checks = [];
  for (const path of ["/", "/docs", "/docs/typescript", "/docs/python", "/device", "/support", "/sitemap.xml", "/tool-sitemap.xml"]) {
    checks.push(await expect(path, 200, undefined, `browser ${path}`, { securityHeaders: true }));
  }
  checks.push(await expectPublicClaim(
    "/features",
    "Observed calls, ranked and trended",
    "Every call, ranked and trended",
    "public feature-claim boundary",
  ));
  checks.push(await expectPublicClaim(
    "/docs/reference",
    "supported tool calls observed at the configured server boundary",
    "On every tool call, the wrapper records",
    "public reference-claim boundary",
  ));
  checks.push(await expectToolSitemap());
  checks.push(...await registryChecks());

  // Keep the production smoke honest about the protected surface. These are
  // deliberately unauthenticated method/status probes: they never mutate
  // data, but catch a public route accidentally becoming callable.
  const protectedApiChecks = [
    ["/api/v2/overview", 401],
    ["/api/v2/data-trust", 401],
    ["/api/v2/protocol-activity", 401],
    ["/api/v1/analytics", 401],
    ["/api/v1/ingest", 405],
    ["/api/v1/otel/v1/traces", 405],
    ["/api/v1/cli/device/sessions", 405],
    ["/api/v1/cli/key-status", 401],
    ["/api/internal/refresh/run", 401],
    ["/api/internal/rate-limit/cleanup", 401],
    ["/api/internal/privacy/review", 401],
  ];
  for (const [path, status] of protectedApiChecks) {
    const options = path.startsWith("/api/internal/")
      ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ max_jobs: 1 }) }
      : undefined;
    checks.push(await expect(path, status, options, `unauthenticated ${path}`));
  }

  const unauthenticated = await request("/api/v1/cli/key-status");
  if (![401, 403].includes(unauthenticated.status)) fail(`unauthenticated key-status: expected HTTP 401/403, received HTTP ${unauthenticated.status}`);
  checks.push({ label: "unauthenticated key-status", status: unauthenticated.status });

  if (revokedKey) {
    const response = await request("/api/v1/cli/key-status", { headers: { authorization: `Bearer ${revokedKey}` } });
    if (![401, 403].includes(response.status)) fail(`revoked-key key-status: expected HTTP 401/403, received HTTP ${response.status}`);
    checks.push({ label: "revoked-key key-status (negative auth)", status: response.status });
  }

  if (key) {
    const response = await keyStatusRequest(key);
    if (![200, 401, 403, 429, 503].includes(response.status)) fail(`authenticated key-status: unexpected HTTP ${response.status}`);
    if (response.status === 200 && (!response.workspaceAvailable || !response.serviceAvailable)) fail("authenticated key-status: workspace or service is unavailable");
    checks.push({ label: "authenticated key-status", status: response.status, accepted_telemetry: response.acceptedTelemetry, workspace_available: response.workspaceAvailable, service_available: response.serviceAvailable });
  } else {
    checks.push({ label: "authenticated key-status", status: "skipped (TRACKMCP_SMOKE_KEY not supplied)" });
  }

  if (allowWrite) {
    const eventId = process.env.TRACKMCP_SMOKE_EVENT_ID || `pilot-smoke-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const startedAt = new Date().toISOString();
    const response = await request("/api/v1/ingest", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ events: [{
        schema_version: "1.0",
        event_id: eventId,
        event_type: "tool_call",
        service: "trackmcp-pilot-smoke",
        environment: "production-smoke",
        started_at: startedAt,
        duration_ms: 1,
        success: true,
        is_error: false,
        payload_policy: "metadata_only",
      }] }),
    });
    if (response.status !== 200) fail(`first-ingest smoke: expected HTTP 200, received HTTP ${response.status}`);
    checks.push({ label: "first-ingest smoke (event ID redacted)", status: response.status });
    let accepted = false;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const status = await keyStatusRequest(key);
      if (status.status === 200 && status.workspaceAvailable && status.serviceAvailable && status.acceptedTelemetry) {
        accepted = true;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 1_000));
    }
    if (!accepted) fail("first-ingest smoke: key-status did not observe the accepted-ingest milestone within the bounded wait");
    checks.push({ label: "first-ingest milestone", status: "observed" });
  } else {
    checks.push({ label: "first-ingest smoke", status: "skipped (set TRACKMCP_SMOKE_ALLOW_WRITE=true explicitly)" });
  }

  const skippedChecks = checks.filter(({ status }) => typeof status === "string" && status.startsWith("skipped")).length;
  const report = {
    outcome: "passed",
    generated_at: new Date().toISOString(),
    base_url: new URL(baseUrl).origin,
    candidate_sha: process.env.TRACKMCP_SMOKE_CANDIDATE_SHA || "not-supplied",
    image_digest: imageDigest,
    write_enabled: allowWrite,
    key_supplied: Boolean(key),
    revoked_key_supplied: Boolean(revokedKey),
    checks_total: checks.length,
    checks_executed: checks.length - skippedChecks,
    checks_skipped: skippedChecks,
    checks,
    caveats: [
      "This report proves HTTP/registry observations only; it does not prove browser auth, workspace selection, dashboard rendering, or cross-workspace authorization.",
      "The ingest check creates one metadata-only event only when TRACKMCP_SMOKE_ALLOW_WRITE=true is explicitly set.",
      "No raw API key, device code, workspace ID, event ID, response body, or credential is written to this report.",
      "Protected API checks are unauthenticated status probes; they do not prove authenticated authorization or tenant isolation.",
    ],
  };
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
  console.log(`Production pilot smoke passed: ${checks.length} checks. Redacted report: ${reportPath}`);
}

main().catch((error) => {
  console.error(`Production pilot smoke failed: ${error.message}`);
  process.exitCode = 1;
});

