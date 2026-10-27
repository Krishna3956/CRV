import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflow = await readFile(new URL("../../.github/workflows/production-transport-smoke.yml", import.meta.url), "utf8");

test("production transport smoke workflow is manual and secret-gated", () => {
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /TRACKMCP_TRANSPORT_SMOKE_KEY/);
  assert.match(workflow, /I_UNDERSTAND_TRANSPORT_SMOKE/);
  assert.match(workflow, /permissions:\s+contents: read/);
});

test("production transport smoke workflow installs the SDK and uploads redacted evidence", () => {
  assert.match(workflow, /npm ci --prefix packages\/typescript-sdk/);
  assert.match(workflow, /production-transport-smoke\.mjs/);
  assert.match(workflow, /Upload redacted transport evidence/);
  assert.match(workflow, /if: always\(\) && steps\.configured\.outputs\.configured == 'true'/);
  assert.doesNotMatch(workflow, /SUPABASE_SERVICE_ROLE_KEY|AWS_ACCESS_KEY/);
});
