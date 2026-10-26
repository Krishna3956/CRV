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

test("refresh scheduler deployment derives the HTTPS endpoint and secret ARN from App Runner", () => {
  assert.match(workflow, /app_runner_service_arn/);
  assert.match(workflow, /aws apprunner describe-service/);
  assert.match(workflow, /RuntimeEnvironmentSecrets\.TRACKMCP_REFRESH_WORKER_SECRET/);
  assert.match(workflow, /App Runner did not return a valid service hostname/);
  assert.match(workflow, /App Runner did not expose a valid TRACKMCP_REFRESH_WORKER_SECRET reference/);
  assert.match(workflow, /WorkerTokenSecretArn="\$WORKER_TOKEN_SECRET_ARN"/);
  assert.doesNotMatch(workflow, /TRACKMCP_REFRESH_WORKER_TOKEN\s*=/);
});

test("refresh scheduler deployment reports only CloudFormation status metadata", () => {
  assert.match(workflow, /describe-stack-resources/);
  assert.match(workflow, /ResourceStatus/);
  assert.match(workflow, /PhysicalResourceId/);
  assert.doesNotMatch(workflow, /get-secret-value|SecretString|response body/i);
});
