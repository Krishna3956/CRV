import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflow = await readFile(new URL("../../.github/workflows/deploy-alert-scheduler.yml", import.meta.url), "utf8");
const template = await readFile(new URL("../workers/alerts-scheduler/template.yaml", import.meta.url), "utf8");

test("alert scheduler deployment is explicit, disabled-first, and secret-safe", () => {
  assert.match(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(workflow, /^\s+push:/m);
  assert.match(workflow, /id-token:\s*write/);
  assert.match(workflow, /aws-actions\/configure-aws-credentials@v4/);
  assert.match(workflow, /aws-actions\/setup-sam@v2/);
  assert.match(workflow, /enable_schedule:[\s\S]*default: false[\s\S]*type: boolean/);
  assert.match(workflow, /run_authenticated_smoke:/);
  assert.match(workflow, /collect_schedule_evidence:/);
  assert.match(workflow, /run_authenticated_smoke requires enable_schedule=false/);
  assert.match(workflow, /TRACKMCP_ALERT_WORKER_TOKEN/);
  assert.match(workflow, /SourceConfiguration\.ImageRepository\.ImageConfiguration\.RuntimeEnvironmentSecrets\.TRACKMCP_ALERT_WORKER_TOKEN/);
  assert.match(workflow, /WORKER_TOKEN_SECRET_ARN_INPUT/);
  assert.match(workflow, /No valid TRACKMCP_ALERT_WORKER_TOKEN ARN was available/);
  assert.match(workflow, /"EvaluatorUrl=\$EVALUATOR_URL"/);
  assert.match(workflow, /"WorkerTokenSecretArn=\$WORKER_TOKEN_SECRET_ARN"/);
  assert.match(workflow, /--no-confirm-changeset/);
  assert.match(workflow, /actions\/upload-artifact@v4/);
  assert.match(workflow, /alert-scheduler-evidence-\$\{\{ github\.run_id \}\}/);
  assert.doesNotMatch(workflow, /aws secretsmanager get-secret-value/);
  assert.doesNotMatch(workflow, /response body|SecretString\b/i);
});

test("alert scheduler deployment derives and validates the App Runner evaluator boundary", () => {
  assert.match(workflow, /aws apprunner describe-service/);
  assert.match(workflow, /EVALUATOR_URL="https:\/\/\$\{ORIGIN\}\/api\/internal\/alerts\/evaluate"/);
  assert.match(workflow, /App Runner did not return a valid service hostname/);
  assert.match(workflow, /aws cloudformation describe-stack-resource/);
  assert.match(workflow, /AlertsSchedulerFunction/);
  assert.match(workflow, /AlertsSchedulerDLQ/);
  assert.match(workflow, /aws lambda invoke/);
  assert.match(workflow, /statusCode \| numbers/);
  assert.match(workflow, /get-queue-attributes/);
  assert.match(workflow, /get-metric-data/);
});

test("alert scheduler template is hourly and disabled until explicitly enabled", () => {
  assert.match(template, /Type: AWS::Scheduler::Schedule/);
  assert.match(template, /ScheduleExpression: rate\(1 hour\)/);
  assert.match(template, /State: !If \[ScheduleEnabled, ENABLED, DISABLED\]/);
  assert.match(template, /Default: 'false'/);
  assert.match(template, /MaximumEventAgeInSeconds: 3600/);
  assert.match(template, /MaximumRetryAttempts: 2/);
  assert.match(template, /DeadLetterConfig:/);
  assert.match(template, /WorkerTokenSecretArn/);
  assert.match(template, /SecretString}}/);
  assert.match(template, /Action: lambda:InvokeFunction/);
  assert.match(template, /Action: sqs:SendMessage/);
});
