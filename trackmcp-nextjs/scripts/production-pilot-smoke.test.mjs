import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./production-pilot-smoke.mjs", import.meta.url), "utf8");

test("production pilot smoke is explicitly opt-in and requires HTTPS", () => {
  assert.match(source, /TRACKMCP_PRODUCTION_SMOKE_CONFIRM/);
  assert.match(source, /I_UNDERSTAND_PRODUCTION_SMOKE/);
  assert.match(source, /url\.protocol !== "https:"/);
  assert.match(source, /TRACKMCP_SMOKE_ALLOW_WRITE/);
});

test("production pilot smoke retries only idempotent reads", () => {
  assert.match(source, /async function fetchReadOnly/);
  assert.match(source, /method !== "GET" && method !== "HEAD"/);
  assert.match(source, /attempt < 3/);
  assert.match(source, /return fetch\(url, options\)/);
});

test("production pilot smoke does not read credentials or emit secrets", () => {
  assert.doesNotMatch(source, /\.env\.deploy|AWS_ACCESS_KEY|SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(source, /No raw API key/);
  assert.match(source, /metadata-only event/);
  assert.match(source, /response body/);
});

test("first-ingest fixture matches the current canonical event envelope", () => {
  assert.match(source, /schema_version: "1"/);
  assert.match(source, /observation_source: "server"/);
  assert.doesNotMatch(source, /schema_version: "1\.0"/);
  assert.doesNotMatch(source, /payload_policy: "metadata_only"/);
  assert.match(source, /user-agent.*TrackMCP\/0\.1\.16 production-smoke/);
});

test("opt-in production write smoke exercises the bounded OTLP/HTTP protobuf path", () => {
  assert.match(source, /application\/x-protobuf/);
  assert.match(source, /sendOtelProtobuf/);
  assert.match(source, /otlp-http-protobuf/);
  assert.match(source, /metadata-only span/);
  assert.match(source, /buildOtelProtobufFixture/);
});

test("production pilot smoke records redacted evidence and covers pilot endpoints", () => {
  for (const marker of ["/api/v1/cli/key-status", "/api/v1/ingest", "/sitemap.xml", "/docs/go", "/docs/dotnet", "/docs/opentelemetry", "/docs/protocol", "/docs/authentication", "registry.npmjs.org", "pypi.org", "outcome: \"passed\"", "checks_total", "checks_executed", "checks_skipped", "candidate_sha", "image_digest", "TRACKMCP_SMOKE_IMAGE_DIGEST"]) {
    assert.match(source, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), marker);
  }
  assert.match(source, /mode: 0o600/);
  assert.match(source, /TRACKMCP_EXPECTED_NPM_SDK_INTEGRITY/);
  assert.match(source, /TRACKMCP_EXPECTED_NPM_CLI_INTEGRITY/);
  assert.match(source, /TRACKMCP_EXPECTED_PYPI_WHEEL_SHA256/);
  assert.match(source, /TRACKMCP_EXPECTED_PYPI_SDIST_SHA256/);
  assert.match(source, /trackmcp@0\.1\.9/);
  assert.match(source, /integrity_present/);
  assert.match(source, /bounded propagation wait/);
  assert.match(source, /wheel_sha256_present/);
  assert.match(source, /expectToolSitemap/);
  assert.match(source, /expectRuntimeIdentity/);
  assert.match(source, /TRACKMCP_SMOKE_CANDIDATE_SHA/);
  assert.match(source, /immutable runtime release identity/);
  assert.match(source, /first_shard_has_urls/);
  assert.match(source, /expectPublicClaim/);
  assert.match(source, /Observed calls, ranked and trended/);
  assert.match(source, /Every call, ranked and trended/);
  assert.match(source, /configured server boundary/);
  assert.match(source, /@trackmcp\/sdk@0\.1\.16/);
});

test("production pilot smoke verifies security headers and protected API boundaries", () => {
  for (const marker of [
    "x-content-type-options",
    "strict-origin-when-cross-origin",
    "permissions-policy",
    "/api/v2/overview",
    "/api/v2/protocol-activity",
    "/api/internal/refresh/run",
    "Protected API checks are unauthenticated status probes",
  ]) {
    assert.match(source, new RegExp(marker.replace(/[.*+?^${}()|[\\]\\]/g, "\\\\$&")), marker);
  }
  assert.match(source, /securityHeaders: true/);
});
