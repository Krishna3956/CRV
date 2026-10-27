import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflow = await readFile(new URL("../../.github/workflows/deploy-refresh-scheduler.yml", import.meta.url), "utf8");
const template = await readFile(new URL("../workers/refresh-scheduler/template.yaml", import.meta.url), "utf8");
const readme = await readFile(new URL("../workers/refresh-scheduler/README.md", import.meta.url), "utf8");

test("refresh scheduler deployment is manual, OIDC-authenticated, and disabled by default", () => {
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /id-token:\s*write/);
  assert.match(workflow, /aws-actions\/configure-aws-credentials@v4/);
  assert.match(workflow, /aws-actions\/setup-sam@v2/);
  assert.match(workflow, /default:\s*false[\s\S]*type:\s*boolean/);
  assert.match(workflow, /run_authenticated_smoke:/);
  assert.match(workflow, /run_authenticated_smoke requires enable_schedule=false/);
  assert.match(workflow, /collect_schedule_evidence/);
  assert.match(workflow, /get-metric-data/);
  assert.match(workflow, /aws-scheduler-metrics\.json/);
  assert.match(workflow, /aws-scheduler-log-streams\.json/);
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
  assert.match(workflow, /describe-stacks/);
  assert.match(workflow, /ResourceStatus/);
  assert.match(workflow, /PhysicalResourceId/);
  assert.match(workflow, /CloudFormation outputs \(non-secret metadata\)/);
  assert.match(workflow, /RefreshSchedulerFunction/);
  assert.match(workflow, /RefreshSchedulerDLQ/);
  assert.match(workflow, /actions\/upload-artifact@v4/);
  assert.match(workflow, /refresh-scheduler-evidence-\$\{\{ github\.run_id \}\}/);
  assert.match(workflow, /retention-days: 14/);
  assert.doesNotMatch(workflow, /get-secret-value|SecretString|response body/i);
});

test("scheduler template records only non-sensitive EventBridge success markers", () => {
  assert.match(template, /SchedulerScheduledSuccessMetricFilter/);
  assert.match(template, /RefreshSchedulerLogGroup/);
  assert.match(template, /RetentionInDays: 14/);
  assert.match(template, /TrackMCP\/RefreshScheduler/);
  assert.match(template, /ScheduledSuccess/);
  assert.match(template, /refresh_scheduler_result/);
  assert.match(template, /Input:.*eventbridge_scheduler/);
});

test("authenticated smoke is explicit, disabled-first, and metadata-only", () => {
  assert.match(workflow, /Run opt-in authenticated Lambda smoke without secret material/);
  assert.match(workflow, /aws lambda invoke --function-name/);
  assert.match(workflow, /statusCode \| numbers/);
  assert.match(workflow, /describe-log-streams/);
  assert.match(workflow, /get-queue-attributes/);
  assert.match(workflow, /--attribute-names ApproximateNumberOfMessages\b/);
  assert.match(workflow, /raw Lambda payloads/);
  assert.doesNotMatch(workflow, /aws logs get-log-events/);
  assert.doesNotMatch(workflow, /aws secretsmanager get-secret-value/);
});

test("refresh scheduler omits an empty optional alarm parameter", () => {
  assert.match(workflow, /PARAM_OVERRIDES=\(/);
  assert.match(workflow, /if \[\[ -n "\$FAILURE_ALARM_TOPIC_ARN" \]\]; then/);
  assert.match(workflow, /PARAM_OVERRIDES\+=\("FailureAlarmTopicArn=\$FAILURE_ALARM_TOPIC_ARN"\)/);
  assert.match(workflow, /STACK_STATUS=\$\(aws cloudformation describe-stacks/);
  assert.match(workflow, /\[\[ "\$STACK_STATUS" == "ROLLBACK_FAILED" \|\| "\$STACK_STATUS" == "ROLLBACK_COMPLETE" \]\]/);
  assert.match(workflow, /aws cloudformation delete-stack --stack-name "\$STACK_NAME"/);
  assert.match(workflow, /aws cloudformation wait stack-delete-complete --stack-name "\$STACK_NAME"/);
  assert.match(workflow, /--parameter-overrides "\$\{PARAM_OVERRIDES\[@\]\}"/);
});

test("refresh scheduler requires a protected dedicated worker secret", () => {
  assert.match(readme, /does not accept a plain-text App Runner environment value/);
  assert.match(readme, /Secrets\s+Manager reference/);
  assert.match(readme, /dedicated secret/);
  assert.match(readme, /plaintext `SecretString`/);
  assert.match(readme, /ScheduledSuccess/);
  assert.match(readme, /Manual\s+invocations do not emit it/);
  assert.match(readme, /[Dd]o not paste/);
});
