import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const workflow = await readFile(new URL("../../.github/workflows/production-ingest-smoke.yml", import.meta.url), "utf8");

test("production first-ingest workflow is manual, secret-gated, and uploads only redacted evidence", () => {
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /TRACKMCP_INGEST_SMOKE_KEY/);
  assert.match(workflow, /I_UNDERSTAND_FIRST_INGEST_SMOKE/);
  assert.match(workflow, /production-ingest-smoke\.mjs/);
  assert.match(workflow, /Upload redacted first-ingest evidence/);
  assert.match(workflow, /permissions:\s+contents: read/);
  assert.doesNotMatch(workflow, /TRACKMCP_LIFECYCLE_COOKIE/);
});

test("first-ingest defaults to the direct App Runner origin rather than the Cloudflare edge", () => {
  assert.match(workflow, /default:\s*"https:\/\/i95pzq2xh7\.ap-south-1\.awsapprunner\.com"/);
  assert.match(workflow, /inputs\.base_url \|\| 'https:\/\/i95pzq2xh7\.ap-south-1\.awsapprunner\.com'/);
  assert.doesNotMatch(workflow, /inputs\.base_url \|\| 'https:\/\/app\.trackmcp\.com'/);
});
