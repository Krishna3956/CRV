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
