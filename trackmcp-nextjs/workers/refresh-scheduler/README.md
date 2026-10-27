# TrackMCP refresh scheduler

This directory contains a Node.js 22 Lambda invoked by an AWS
`AWS::Scheduler::Schedule`. It sends one authenticated, bounded batch request
(`max_jobs: 100`) to the App Runner refresh endpoint. It never queries
Supabase directly and never logs the worker token or response body.

The schedule is disabled by default. Deploy it disabled first, run the manual
checks below, and enable it only after the endpoint and secret have been
verified in the target environment. The repository workflow discovers the
App Runner hostname and, when AWS exposes it, the
`TRACKMCP_REFRESH_WORKER_SECRET` ARN from the selected service's public
configuration; it never reads or prints the secret value. Some App Runner
configurations redact runtime secret mappings from `describe-service`; in that
case provide only the non-sensitive Secrets Manager ARN through the workflow's
optional `worker_token_secret_arn` input.

The scheduler does not accept a plain-text App Runner value for this variable.
Before dispatching the workflow, open App Runner → Configuration → Runtime
environment variables and change `TRACKMCP_REFRESH_WORKER_SECRET` to a Secrets
Manager reference. The reference must resolve to a JSON secret field named
`TRACKMCP_REFRESH_WORKER_SECRET`; do not paste the token into the workflow
input, source tree, CloudFormation parameters, or logs. If App Runner redacts
the reference during discovery, pass only the non-sensitive secret ARN as
`worker_token_secret_arn`.

```bash
export AWS_REGION=ap-south-1
export STACK_NAME=trackmcp-refresh-scheduler-staging
export WORKER_URL=https://staging.example.com/api/internal/refresh/run
export WORKER_TOKEN_SECRET_ARN=arn:aws:secretsmanager:ap-south-1:123456789012:secret:trackmcp/runtime
export FAILURE_ALARM_TOPIC_ARN=''

sam build --template-file template.yaml --build-dir .aws-sam/build
PARAM_OVERRIDES=(WorkerUrl="$WORKER_URL" WorkerTokenSecretArn="$WORKER_TOKEN_SECRET_ARN" EnableSchedule=false)
if [[ -n "$FAILURE_ALARM_TOPIC_ARN" ]]; then
  PARAM_OVERRIDES+=(FailureAlarmTopicArn="$FAILURE_ALARM_TOPIC_ARN")
fi
sam deploy --template-file .aws-sam/build/template.yaml \
  --stack-name "$STACK_NAME" --region "$AWS_REGION" \
  --capabilities CAPABILITY_IAM --resolve-s3 \
  --parameter-overrides "${PARAM_OVERRIDES[@]}"
```

Before enabling the schedule:

1. Confirm an unauthenticated request returns `401`.
2. Confirm an incorrect bearer token returns `401`.
3. Load the real token only from the protected secret store and confirm the
   endpoint returns a bounded JSON result; never put it in source, logs, or
   CloudFormation outputs.
4. Invoke the Lambda manually and inspect logs for token/response leakage.
5. Check the SQS DLQ is empty and the two CloudWatch alarms are configured.
6. Enable the schedule with `EnableSchedule=true`, then verify at least three
   scheduled invocations and a queue-lag result within the 15-minute pilot
   freshness budget before widening the pilot.

## Reproducible inspection commands

The following commands collect non-secret evidence after a disabled deployment.
They resolve generated physical names from CloudFormation and never print the
worker token or response body:

```bash
export FUNCTION_NAME="$(aws cloudformation describe-stack-resource \
  --stack-name "$STACK_NAME" --logical-resource-id RefreshSchedulerFunction \
  --region "$AWS_REGION" --query 'StackResourceDetail.PhysicalResourceId' \
  --output text)"
aws lambda invoke --function-name "$FUNCTION_NAME" --region "$AWS_REGION" \
  --payload '{}' --cli-binary-format raw-in-base64-out /tmp/trackmcp-refresh-scheduler.json
cat /tmp/trackmcp-refresh-scheduler.json
aws logs tail "/aws/lambda/$FUNCTION_NAME" --since 1h --region "$AWS_REGION"

export SCHEDULE_NAME="$(aws cloudformation describe-stack-resource \
  --stack-name "$STACK_NAME" --logical-resource-id RefreshSchedulerSchedule \
  --region "$AWS_REGION" --query 'StackResourceDetail.PhysicalResourceId' \
  --output text)"
aws scheduler get-schedule --name "$SCHEDULE_NAME" --region "$AWS_REGION"
aws cloudwatch describe-alarms --alarm-name-prefix "$STACK_NAME" --region "$AWS_REGION"
export DLQ_URL="$(aws cloudformation describe-stack-resource \
  --stack-name "$STACK_NAME" --logical-resource-id RefreshSchedulerDLQ \
  --region "$AWS_REGION" --query 'StackResourceDetail.PhysicalResourceId' \
  --output text)"
aws sqs get-queue-attributes --queue-url "$DLQ_URL" \
  --attribute-names ApproximateNumberOfMessagesVisible --region "$AWS_REGION"
unset FUNCTION_NAME SCHEDULE_NAME DLQ_URL
```

Before invoking the function, the operator must separately verify that an
unauthenticated request and an incorrect bearer token both return `401`, then
load the real token only from the protected secret store. Keep the schedule
disabled until those checks, the log review, and the DLQ/alarm review pass.

To remove a test stack, disable it first and then delete it only after checking
for in-flight work:

```bash
sam delete --stack-name "$STACK_NAME" --region "$AWS_REGION"
```

The IAM role created by this template is limited to invoking this Lambda and
writing failed scheduler deliveries to its own DLQ. The Lambda receives only
the `TRACKMCP_REFRESH_WORKER_SECRET` field from the JSON secret bundle through
an AWS Secrets Manager dynamic reference; the bundle and token are never
written to CloudFormation outputs or logs.
