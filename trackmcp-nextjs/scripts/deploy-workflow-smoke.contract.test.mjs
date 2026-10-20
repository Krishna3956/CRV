import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflow = await readFile(new URL("../../.github/workflows/deploy.yml", import.meta.url), "utf8");

test("App Runner deployment performs a redacted read-only smoke after RUNNING", () => {
  assert.match(workflow, /actions\/setup-node@v4/);
  assert.match(workflow, /Install production-smoke dependencies/);
  assert.match(workflow, /Run release gate before deployment/);
  assert.match(workflow, /npm run test:release-gate/);
  assert.match(workflow, /Run read-only production smoke/);
  assert.match(workflow, /TRACKMCP_PRODUCTION_SMOKE_CONFIRM=I_UNDERSTAND_PRODUCTION_SMOKE/);
  assert.match(workflow, /TRACKMCP_SMOKE_CANDIDATE_SHA="\$GITHUB_SHA"/);
  assert.match(workflow, /npm run smoke:production-pilot/);
  assert.match(workflow, /Upload redacted production smoke evidence/);
  assert.doesNotMatch(workflow, /TRACKMCP_SMOKE_ALLOW_WRITE=true/);
});
