import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflow = await readFile(new URL("../../.github/workflows/deploy-refresh-scheduler.yml", import.meta.url), "utf8");

test("refresh scheduler deployment is manual, OIDC-authenticated, and disabled by default", () => {
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /id-token:\s*write/);
  assert.match(workflow, /aws-actions\/configure-aws-credentials@v4/);
  assert.match(workflow, /aws-actions\/setup-sam@v2/);
  assert.match(workflow, /default:\s*false[\s\S]*type:\s*boolean/);
  assert.match(workflow, /EnableSchedule=\"\$ENABLE_SCHEDULE\"/);
  assert.match(workflow, /--no-confirm-changeset/);
});

test("refresh scheduler deployment validates HTTPS and Secrets Manager inputs", () => {
  assert.match(workflow, /worker_url must be an HTTPS URL/);
  assert.match(workflow, /worker_token_secret_arn must be a Secrets Manager ARN/);
  assert.match(workflow, /Secrets Manager ARN containing the JSON bundle with TRACKMCP_REFRESH_WORKER_SECRET/);
  assert.doesNotMatch(workflow, /TRACKMCP_REFRESH_WORKER_TOKEN\s*=/);
});

test("refresh scheduler deployment reports only CloudFormation status metadata", () => {
  assert.match(workflow, /describe-stack-resources/);
  assert.match(workflow, /ResourceStatus/);
  assert.match(workflow, /PhysicalResourceId/);
  assert.doesNotMatch(workflow, /get-secret-value|SecretString|response body/i);
});
