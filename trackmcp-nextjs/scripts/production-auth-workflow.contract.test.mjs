import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflow = await readFile(new URL("../../.github/workflows/production-auth-smoke.yml", import.meta.url), "utf8");

test("authenticated production smoke is manual, read-only, and secret-bounded", () => {
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /timeout-minutes: 10/);
  assert.match(workflow, /TRACKMCP_AUTH_SMOKE_CONFIRM: I_UNDERSTAND_PRODUCTION_AUTH_SMOKE/);
  for (const secret of ["TRACKMCP_AUTH_SMOKE_KEY_A", "TRACKMCP_AUTH_SMOKE_KEY_B", "TRACKMCP_AUTH_SMOKE_WORKSPACE_A", "TRACKMCP_AUTH_SMOKE_WORKSPACE_B", "TRACKMCP_AUTH_SMOKE_REVOKED_KEY"]) {
    assert.match(workflow, new RegExp(`secrets\\.${secret}`));
  }
  assert.match(workflow, /node scripts\/production-auth-smoke\.mjs/);
  assert.match(workflow, /production-auth-smoke-\$\{\{ github\.sha \}\}/);
  assert.doesNotMatch(workflow, /TRACKMCP_SMOKE_ALLOW_WRITE/);
  assert.doesNotMatch(workflow, /TRACKMCP_AUTH_SMOKE_REPORT.*key/);
});
