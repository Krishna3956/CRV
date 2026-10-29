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
  const trustedHost = url.hostname === "trackmcp.com" || url.hostname === "app.trackmcp.com" || url.hostname.endsWith(".awsapprunner.com");
  if (!trustedHost) fail("Production smoke requires a trusted TrackMCP or App Runner host.");
  if (url.username || url.password || url.search || url.hash) fail("Base URL must not contain credentials, query parameters, or fragments.");
  if (allowWrite && !key) fail("TRACKMCP_SMOKE_KEY is required when TRACKMCP_SMOKE_ALLOW_WRITE=true.");
  if (requireAuth && !key) fail("TRACKMCP_SMOKE_KEY is required when TRACKMCP_SMOKE_REQUIRE_AUTH=true.");
}

function endpoint(path) { return new URL(path, `${baseUrl.replace(/\/$/, "")}/`); }

async function fetchReadOnly(url, options = {}) {
  const method = String(options.method || "GET").toUpperCase();
  if (method !== "GET" && method !== "HEAD") return fetch(url, options);
  const { timeoutMs, signal, ...fetchOptions } = options;
  let lastError;
  // App Runner can report RUNNING a few seconds before the first container is
  // ready to serve every prerendered route. Keep the retry window bounded but
  // long enough to cover that normal post-rollout warm-up.
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      // A timed-out AbortSignal stays aborted forever. Create a fresh signal
      // for each idempotent retry so a transient cold-start/origin timeout can
      // actually be retried without weakening the per-attempt bound.
      const attemptSignal = timeoutMs ? AbortSignal.timeout(timeoutMs) : signal;
      const response = await fetch(url, { ...fetchOptions, ...(attemptSignal ? { signal: attemptSignal } : {}) });
      // App Runner can briefly return a provider-generated 502/503/504 while
      // a freshly rolled instance is warming. Retry only idempotent reads;
      // never retry writes or turn an application 4xx into a false pass.
      if ([502, 503, 504].includes(response.status) && attempt < 7) {
        await response.body?.cancel();
        await new Promise((resolve) => setTimeout(resolve, Math.min(5_000, 1_000 * (attempt + 1))));
        continue;
      }
      return response;
    } catch (error) {
      lastError = error;
      // A freshly promoted App Runner instance can accept the service-level
      // RUNNING status before its first request path is warm. Treat an
      // idempotent timeout like a transient 502/503 and use the same bounded
      // retry window, rather than failing the deployment on the first cold
      // route. Writes never enter this helper.
      if (attempt < 7) {
        await new Promise((resolve) => setTimeout(resolve, Math.min(5_000, 1_000 * (attempt + 1))));
      }
    }
  }
  throw lastError;
}

async function request(path, options = {}) {
  const response = await fetchReadOnly(endpoint(path), {
    ...options,
    redirect: "manual",
    headers: { "user-agent": "TrackMCP/0.1.25 production-smoke", ...(options.headers || {}) },
    timeoutMs: 15_000,
  });
  return { status: response.status, headers: response.headers };
}

// Minimal OTLP/HTTP protobuf fixture used only when the operator explicitly
// enables the write smoke. It contains metadata-only service/method fields;
// no customer payload or credential is written to the report.
const protobufVarint = (value) => {
  let current = BigInt(value);
  const bytes = [];
  do {
    const next = Number(current & 0x7fn);
    current >>= 7n;
    bytes.push(next | (current ? 0x80 : 0));
  } while (current);
  return bytes;
};
const protobufField = (number, wire, value) => {
  const bytes = Array.isArray(value) ? value : protobufVarint(value);
  return [...protobufVarint((BigInt(number) << 3n) | BigInt(wire)), ...(wire === 2 ? [...protobufVarint(bytes.length), ...bytes] : bytes)];
};
const protobufMessage = (...fields) => Uint8Array.from(fields.flat());
const protobufStringField = (number, value) => protobufField(number, 2, [...new TextEncoder().encode(value)]);
const protobufNestedField = (number, value) => protobufField(number, 2, [...value]);
function buildOtelProtobufFixture() {
  const service = protobufMessage(protobufStringField(1, "service.name"), protobufNestedField(2, protobufMessage(protobufStringField(1, "trackmcp-pilot-smoke"))));
  const method = protobufMessage(protobufStringField(1, "mcp.method.name"), protobufNestedField(2, protobufMessage(protobufStringField(1, "tools/call"))));
  const span = protobufMessage(protobufStringField(5, "tools/call"), protobufField(7, 0, 1700000000000000000n), protobufField(8, 0, 1700000000100000000n), protobufNestedField(9, method));
  const scope = protobufMessage(protobufNestedField(2, span));
  const resource = protobufMessage(protobufNestedField(1, service));
  const resourceSpans = protobufMessage(protobufNestedField(1, resource), protobufNestedField(2, scope));
  return protobufMessage(protobufNestedField(1, resourceSpans));
}

async function sendOtelProtobuf(apiKey) {
  const response = await fetch(endpoint("/api/v1/otel/v1/traces"), {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/x-protobuf", "user-agent": "TrackMCP/0.1.25 production-smoke" },
    body: buildOtelProtobufFixture(),
    redirect: "manual",
    signal: AbortSignal.timeout(15_000),
  });
  if (response.status !== 200) fail(`OTLP/HTTP protobuf smoke: expected HTTP 200, received HTTP ${response.status}`);
  const protocol = response.headers.get("x-trackmcp-otel-protocol");
  if (protocol !== "otlp-http-protobuf") fail("OTLP/HTTP protobuf smoke: protocol response header was not observed");
  return { label: "OTLP/HTTP protobuf first-ingest smoke (payload redacted)", status: response.status, protocol };
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
  const response = await fetchReadOnly(endpoint("/api/v1/cli/key-status"), {
    method: "GET",
    headers: { accept: "application/json", "user-agent": "TrackMCP/0.1.25 production-smoke", authorization: `Bearer ${apiKey}` },
    redirect: "manual",
    timeoutMs: 15_000,
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
  const response = await fetchReadOnly(endpoint(path), {
    redirect: "manual",
    timeoutMs: 15_000,
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
  const response = await fetchReadOnly(endpoint("/tool-sitemap.xml"), {
    redirect: "manual",
    timeoutMs: 15_000,
    headers: { accept: "application/xml,text/xml" },
  });
  if (response.status !== 200) fail(`tool sitemap index: expected HTTP 200, received HTTP ${response.status}`);
  const index = await response.text();
  if (!index.includes("<sitemapindex") || !index.includes("/tool-sitemap/0.xml")) fail("tool sitemap index: missing XML index or first shard");
  const shard = await fetchReadOnly(endpoint("/tool-sitemap/0.xml"), {
    redirect: "manual",
    timeoutMs: 15_000,
    headers: { accept: "application/xml,text/xml" },
  });
  if (shard.status !== 200) fail(`tool sitemap first shard: expected HTTP 200, received HTTP ${shard.status}`);
  const xml = await shard.text();
  if (!xml.includes("<urlset") || !xml.includes("<loc>")) fail("tool sitemap first shard: missing URL entries");
  return { label: "tool sitemap index and first shard", status: 200, first_shard_has_urls: true };
}

async function expectRuntimeIdentity() {
  const response = await fetchReadOnly(endpoint("/api/health"), {
    redirect: "manual",
    timeoutMs: 15_000,
    headers: { accept: "application/json" },
  });
  if (response.status !== 200) fail(`runtime identity: expected HTTP 200, received HTTP ${response.status}`);
  const body = await response.json();
  if (!body || body.status !== "ok" || typeof body.release_sha !== "string") {
    fail("runtime identity: health response did not contain the bounded status/release_sha contract");
  }
  const expected = process.env.TRACKMCP_SMOKE_CANDIDATE_SHA || "";
  if (expected && body.release_sha !== expected) {
    fail(`runtime identity: expected candidate SHA ${expected}, received ${body.release_sha}`);
  }
  return {
    label: "immutable runtime release identity",
    status: response.status,
    release_sha_present: true,
    candidate_sha_match: expected ? true : "not-supplied",
  };
}

async function registryChecks() {
  const checks = [];
  const npmPackage = process.env.TRACKMCP_EXPECTED_NPM_SDK || "@trackmcp/sdk@0.1.25";
  const cliPackage = process.env.TRACKMCP_EXPECTED_NPM_CLI || "@trackmcp/cli@0.1.12";
  const pythonPackage = process.env.TRACKMCP_EXPECTED_PYPI || "trackmcp@0.1.15";
  const expectedNpmIntegrity = {
    [npmPackage]: process.env.TRACKMCP_EXPECTED_NPM_SDK_INTEGRITY || "",
    [cliPackage]: process.env.TRACKMCP_EXPECTED_NPM_CLI_INTEGRITY || "",
  };
  for (const spec of [npmPackage, cliPackage]) {
    const at = spec.lastIndexOf("@");
    const name = spec.slice(0, at);
    const version = spec.slice(at + 1);
    const response = await fetchReadOnly(`https://registry.npmjs.org/${encodeURIComponent(name)}/${encodeURIComponent(version)}`, { timeoutMs: 15_000 });
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
  const expectedWheel = process.env.TRACKMCP_EXPECTED_PYPI_WHEEL_SHA256
    || "";
  const expectedSdist = process.env.TRACKMCP_EXPECTED_PYPI_SDIST_SHA256
    || "";
  // PyPI can briefly expose the version before its file list and digests have
  // propagated to every edge. Retry that narrow condition, but never weaken
  // the exact checksum comparison once the files are visible.
  let response;
  let metadata;
  let wheel;
  let sdist;
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    response = await fetchReadOnly(`https://pypi.org/pypi/${encodeURIComponent(name)}/${encodeURIComponent(version)}/json`, { timeoutMs: 15_000 });
    if (!response.ok) fail(`PyPI registry check failed for ${name}==${version}: HTTP ${response.status}`);
    metadata = await response.json();
    if (metadata.info?.name !== name || metadata.info?.version !== version) fail(`PyPI registry metadata mismatch for ${name}==${version}`);
    const files = Array.isArray(metadata.urls) ? metadata.urls : [];
    wheel = files.find((file) => file.packagetype === "bdist_wheel");
    sdist = files.find((file) => file.packagetype === "sdist");
    if (wheel?.digests?.sha256 && sdist?.digests?.sha256) break;
    if (attempt < 6) await new Promise((resolve) => setTimeout(resolve, 5_000));
  }
  if (!wheel?.digests?.sha256 || !sdist?.digests?.sha256) fail(`PyPI checksums missing for ${name}==${version} after bounded propagation wait`);
  if (expectedWheel && wheel.digests.sha256 !== expectedWheel) fail(`PyPI wheel checksum mismatch for ${name}==${version}`);
  if (expectedSdist && sdist.digests.sha256 !== expectedSdist) fail(`PyPI sdist checksum mismatch for ${name}==${version}`);
  checks.push({ label: `PyPI ${name}==${version}`, status: response.status, wheel_sha256_present: true, sdist_sha256_present: true });
  return checks;
}

async function main() {
  validateOptIn();
  const checks = [];
  // Keep every public documentation destination in the smoke. A docs link is
  // part of the activation path, so checking only the hub and two SDK pages
  // can let a broken Go/.NET/reference/OAuth link reach a pilot user.
  const publicRoutes = [
    "/", "/docs", "/docs/typescript", "/docs/python", "/docs/go", "/docs/dotnet",
    "/docs/api", "/docs/reference", "/docs/opentelemetry", "/docs/protocol",
    "/docs/authentication", "/device", "/support", "/sitemap.xml", "/tool-sitemap.xml",
  ];
  for (const path of publicRoutes) {
    checks.push(await expect(path, 200, undefined, `browser ${path}`, { securityHeaders: true }));
  }
  checks.push(await expectRuntimeIdentity());
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
        schema_version: "1",
        observation_source: "server",
        event_id: eventId,
        event_type: "tool_call",
        service: "trackmcp-pilot-smoke",
        environment: "production-smoke",
        started_at: startedAt,
        duration_ms: 1,
        success: true,
        is_error: false,
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
    checks.push(await sendOtelProtobuf(key));
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
      "The OTLP/HTTP protobuf check creates one metadata-only span only when TRACKMCP_SMOKE_ALLOW_WRITE=true is explicitly set.",
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

