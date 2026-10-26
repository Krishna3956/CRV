import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflow = await readFile(new URL("../../.github/workflows/deploy-refresh-scheduler.yml", import.meta.url), "utf8");
const readme = await readFile(new URL("../workers/refresh-scheduler/README.md", import.meta.url), "utf8");

test("refresh scheduler deployment is manual, OIDC-authenticated, and disabled by default", () => {
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /id-token:\s*write/);
  assert.match(workflow, /aws-actions\/configure-aws-credentials@v4/);
  assert.match(workflow, /aws-actions\/setup-sam@v2/);
  assert.match(workflow, /default:\s*false[\s\S]*type:\s*boolean/);
  assert.match(workflow, /\"EnableSchedule=\$ENABLE_SCHEDULE\"/);
  assert.match(workflow, /--no-confirm-changeset/);
});

test("refresh scheduler deployment derives the HTTPS endpoint and secret ARN from App Runner", () => {
  assert.match(workflow, /app_runner_service_arn/);
  assert.match(workflow, /aws apprunner describe-service/);
  assert.match(workflow, /SourceConfiguration\.ImageRepository\.ImageConfiguration\.RuntimeEnvironmentSecrets\.TRACKMCP_REFRESH_WORKER_SECRET/);
  assert.match(workflow, /worker_token_secret_arn/);
  assert.match(workflow, /WORKER_TOKEN_SECRET_ARN_INPUT/);
  assert.match(workflow, /App Runner did not return a valid service hostname/);
  assert.match(workflow, /No valid TRACKMCP_REFRESH_WORKER_SECRET ARN was available/);
  assert.match(workflow, /\"WorkerTokenSecretArn=\$WORKER_TOKEN_SECRET_ARN\"/);
  assert.doesNotMatch(workflow, /TRACKMCP_REFRESH_WORKER_TOKEN\s*=/);
});

test("refresh scheduler deployment reports only CloudFormation status metadata", () => {
  assert.match(workflow, /describe-stack-resources/);
  assert.match(workflow, /ResourceStatus/);
  assert.match(workflow, /PhysicalResourceId/);
  assert.doesNotMatch(workflow, /get-secret-value|SecretString|response body/i);
});

test("refresh scheduler omits an empty optional alarm parameter", () => {
  assert.match(workflow, /PARAM_OVERRIDES=\(/);
  assert.match(workflow, /if \[\[ -n "\$FAILURE_ALARM_TOPIC_ARN" \]\]; then/);
  assert.match(workflow, /PARAM_OVERRIDES\+=\("FailureAlarmTopicArn=\$FAILURE_ALARM_TOPIC_ARN"\)/);
  assert.match(workflow, /STACK_STATUS=\$\(aws cloudformation describe-stacks/);
  assert.match(workflow, /\[\[ "\$STACK_STATUS" == "ROLLBACK_FAILED" \]\]/);
  assert.match(workflow, /aws cloudformation delete-stack --stack-name "\$STACK_NAME"/);
  assert.match(workflow, /aws cloudformation wait stack-delete-complete --stack-name "\$STACK_NAME"/);
  assert.match(workflow, /--parameter-overrides "\$\{PARAM_OVERRIDES\[@\]\}"/);
});

test("refresh scheduler refuses a plain-text App Runner worker token", () => {
  assert.match(readme, /does not accept a plain-text App Runner value/);
    assert.match(readme, /Secrets\s+Manager reference/);
    assert.match(readme, /do not paste\s+the token/);
});
