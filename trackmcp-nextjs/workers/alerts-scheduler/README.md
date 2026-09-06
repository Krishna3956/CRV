# TrackMCP alert scheduler

This directory contains the Node.js 22 Lambda invoked by an AWS
`AWS::Scheduler::Schedule`. The Lambda sends an authenticated, bounded
`POST` to the App Runner evaluator route. It never queries PostgreSQL directly
and never logs the worker token or evaluator response body. Email delivery is
disabled in this increment; generic signed webhooks are the only delivery
provider.

## Fixed deployment values

Use explicit values for every deployment. The examples below use:

```bash
export AWS_REGION=us-east-1
export STACK_NAME=trackmcp-alert-scheduler-staging
export EVALUATOR_URL=https://staging.example.com/api/internal/alerts/evaluate
export WORKER_TOKEN_SECRET_ARN=arn:aws:secretsmanager:us-east-1:123456789012:secret:trackmcp/alerts/worker
export FAILURE_ALARM_TOPIC_ARN=''
```

`EVALUATOR_URL` must be the HTTPS App Runner origin plus
`/api/internal/alerts/evaluate`. `STACK_NAME` is the CloudFormation stack
name. The `WORKER_TOKEN_SECRET_ARN` secret must contain the exact random value
configured as the App Runner `TRACKMCP_ALERT_WORKER_TOKEN` environment
variable. Protect that value locally; do not place it in source, shell
history, logs, CloudFormation outputs, or alert payloads.

The Lambda receives these environment variables from the template:

- `TRACKMCP_ALERT_EVALUATOR_URL`: the exact authenticated App Runner evaluator URL.
- `TRACKMCP_ALERT_WORKER_TOKEN`: the Secrets Manager `SecretString` value
  resolved from `WORKER_TOKEN_SECRET_ARN`.

## Build and deploy with the schedule disabled

From this directory:

```bash
sam build --template-file template.yaml --build-dir .aws-sam/build

sam deploy \
  --template-file .aws-sam/build/template.yaml \
  --stack-name "$STACK_NAME" \
  --region "$AWS_REGION" \
  --capabilities CAPABILITY_IAM \
  --resolve-s3 \
  --parameter-overrides \
    EvaluatorUrl="$EVALUATOR_URL" \
    WorkerTokenSecretArn="$WORKER_TOKEN_SECRET_ARN" \
    EnableSchedule=false \
    FailureAlarmTopicArn="$FAILURE_ALARM_TOPIC_ARN"
```

The template creates the Node.js 22 Lambda, explicit scheduler role and
permission, one-hour scheduler retry/max-age settings, SQS DLQ, and Lambda/DLQ
CloudWatch alarms. The schedule is disabled by default. Alarm actions are also
disabled unless `FAILURE_ALARM_TOPIC_ARN` is a real SNS topic ARN.

## Required pre-enable sequence

Perform these steps in order; do not enable the schedule early:

1. Deploy the App Runner application.
2. Verify an unauthenticated evaluator request returns `401`:

   ```bash
   curl -i -X POST "$EVALUATOR_URL" -H 'content-type: application/json' -d '{}'
   ```

3. Verify an incorrect worker token returns `401`:

   ```bash
   curl -i -X POST "$EVALUATOR_URL" \
     -H 'content-type: application/json' \
     -H 'x-trackmcp-worker-token: incorrect-test-token' -d '{}'
   ```

4. Verify the correct token produces a bounded evaluator response. Load the
   token from a protected local environment, never from source control:

   ```bash
   export WORKER_TOKEN='retrieve-this-from-the-protected-secret-store'
   curl -i -X POST "$EVALUATOR_URL" \
     -H 'content-type: application/json' \
     -H "x-trackmcp-worker-token: $WORKER_TOKEN" -d '{}'
   unset WORKER_TOKEN
   ```

5. Keep `EnableSchedule=false`.
6. Deploy the SAM stack with the command above.
7. Manually invoke the Lambda:

   ```bash
   export FUNCTION_NAME="$(aws cloudformation describe-stack-resource \
     --stack-name "$STACK_NAME" --logical-resource-id AlertsSchedulerFunction \
     --region "$AWS_REGION" --query 'StackResourceDetail.PhysicalResourceId' \
     --output text)"
   aws lambda invoke --function-name "$FUNCTION_NAME" --region "$AWS_REGION" \
     --payload '{}' --cli-binary-format raw-in-base64-out /tmp/trackmcp-alert-scheduler.json
   cat /tmp/trackmcp-alert-scheduler.json
   ```

8. Inspect logs for secret leakage, response bodies, and duplicate invocation
   behavior:

   ```bash
   aws logs tail "/aws/lambda/$FUNCTION_NAME" --since 1h \
     --region "$AWS_REGION"
   ```

9. Run a staging shadow evaluation with delivery disabled and verify the
   database lease, evaluation key, and delivery idempotency behavior.
10. Enable alert configuration for only one canary workspace after shadow
    results and alarm/DLQ checks are accepted; keep the Scheduler disabled.
11. Verify the canary lifecycle, bounded evaluator response, absence of secret
    leakage, single delivery per idempotency key, retry/backoff behavior, and
    recovery before expanding scope.

## Enablement, inspection, and alarms

Enable only after steps 1–10 have passed:

```bash
sam deploy \
  --template-file .aws-sam/build/template.yaml \
  --stack-name "$STACK_NAME" \
  --region "$AWS_REGION" \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    EvaluatorUrl="$EVALUATOR_URL" \
    WorkerTokenSecretArn="$WORKER_TOKEN_SECRET_ARN" \
    EnableSchedule=true \
    FailureAlarmTopicArn="$FAILURE_ALARM_TOPIC_ARN"
```

Inspect the schedule, alarms, Lambda logs, and DLQ without exposing secrets:

```bash
export SCHEDULE_NAME="$(aws cloudformation describe-stack-resource \
  --stack-name "$STACK_NAME" --logical-resource-id AlertsSchedulerSchedule \
  --region "$AWS_REGION" --query 'StackResourceDetail.PhysicalResourceId' \
  --output text)"
aws scheduler get-schedule --name "$SCHEDULE_NAME" --region "$AWS_REGION"
aws cloudwatch describe-alarms --alarm-name-prefix "$STACK_NAME" --region "$AWS_REGION"
aws logs tail "/aws/lambda/$FUNCTION_NAME" --since 1h --region "$AWS_REGION"
export DLQ_URL="$(aws cloudformation describe-stack-resource \
  --stack-name "$STACK_NAME" --logical-resource-id AlertsSchedulerDLQ \
  --region "$AWS_REGION" --query 'StackResourceDetail.PhysicalResourceId' \
  --output text)"
aws sqs get-queue-attributes --queue-url "$DLQ_URL" \
  --attribute-names ApproximateNumberOfMessagesVisible --region "$AWS_REGION"
unset DLQ_URL
unset SCHEDULE_NAME
```

The exact physical schedule and queue names should be obtained from
`aws cloudformation describe-stack-resources` if the stack has generated
names. Do not print environment variables containing the worker token.

## Rollback or removal

First disable the schedule and stop delivery at the application/configuration
layer, then inspect any in-flight or retryable deliveries. A worker rollback
does not roll back the forward-only PostgreSQL migration; database rollback
requires the separately reviewed manual SQL procedure.

```bash
sam deploy \
  --template-file .aws-sam/build/template.yaml \
  --stack-name "$STACK_NAME" \
  --region "$AWS_REGION" \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    EvaluatorUrl="$EVALUATOR_URL" \
    WorkerTokenSecretArn="$WORKER_TOKEN_SECRET_ARN" \
    EnableSchedule=false \
    FailureAlarmTopicArn="$FAILURE_ALARM_TOPIC_ARN"

sam delete --stack-name "$STACK_NAME" --region "$AWS_REGION"
```

Revoke or rotate the Secrets Manager value and the matching App Runner token
after removal. DNS destination validation performs a check-then-fetch with
redirects disabled; it is not a proof against DNS rebinding, so use normal
egress controls. Only trusted public HTTPS endpoints are supported.
