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

test("production pilot smoke does not read credentials or emit secrets", () => {
  assert.doesNotMatch(source, /\.env\.deploy|AWS_ACCESS_KEY|SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(source, /No raw API key/);
  assert.match(source, /metadata-only event/);
  assert.match(source, /response body/);
});

test("production pilot smoke records redacted evidence and covers pilot endpoints", () => {
  for (const marker of ["/api/v1/cli/key-status", "/api/v1/ingest", "/sitemap.xml", "registry.npmjs.org", "pypi.org", "candidate_sha"]) {
    assert.match(source, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), marker);
  }
  assert.match(source, /mode: 0o600/);
});
