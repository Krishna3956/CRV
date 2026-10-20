import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflow = await readFile(new URL("../../.github/workflows/deploy.yml", import.meta.url), "utf8");

test("App Runner deployment performs a redacted read-only smoke after RUNNING", () => {
  assert.match(workflow, /actions\/setup-node@v4/);
  assert.match(workflow, /actions\/setup-python@v5/);
  assert.match(workflow, /Install production-smoke dependencies/);
  assert.match(workflow, /Install Python package build dependency/);
  assert.match(workflow, /python3 -m pip install build/);
  assert.match(workflow, /Run release gate before deployment/);
  assert.match(workflow, /npm run test:release-gate/);
  assert.match(workflow, /Verify deployment tag resolves to the candidate image/);
  assert.match(workflow, /deploy-tag-push\.log/);
  assert.match(workflow, /candidate-tag-push\.log/);
  assert.doesNotMatch(workflow, /ecr describe-images/);
  assert.match(workflow, /TRACKMCP_DEPLOYED_IMAGE_DIGEST/);
  assert.match(workflow, /TRACKMCP_SMOKE_IMAGE_DIGEST/);
  assert.match(workflow, /TRACKMCP_DEPLOYMENT_OPERATION_ID=\$OP_ID/);
  assert.match(workflow, /App Runner operation IDs are opaque service identifiers/);
  assert.match(workflow, /TRACKMCP_DEPLOYMENT_OPERATION_ID/);
  assert.match(workflow, /list-operations/);
  assert.match(workflow, /OperationSummaryList\[\?Id=='\$TRACKMCP_DEPLOYMENT_OPERATION_ID'\]\.Status/);
  assert.match(workflow, /SUCCEEDED/);
  assert.match(workflow, /ROLLBACK_FAILED/);
  assert.match(workflow, /Run read-only production smoke/);
  assert.match(workflow, /TRACKMCP_PRODUCTION_SMOKE_CONFIRM=I_UNDERSTAND_PRODUCTION_SMOKE/);
  assert.match(workflow, /TRACKMCP_SMOKE_CANDIDATE_SHA="\$GITHUB_SHA"/);
  assert.match(workflow, /npm run smoke:production-pilot/);
  assert.match(workflow, /Upload redacted production smoke evidence/);
  assert.doesNotMatch(workflow, /TRACKMCP_SMOKE_ALLOW_WRITE=true/);
});
