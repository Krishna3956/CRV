# TrackMCP refresh scheduler

This directory contains a Node.js 22 Lambda invoked by an AWS
`AWS::Scheduler::Schedule`. It sends one authenticated, bounded batch request
(`max_jobs: 100`) to the App Runner refresh endpoint. It never queries
Supabase directly and never logs the worker token or response body.

The schedule is disabled by default. Deploy it disabled first, run the manual
checks below, and enable it only after the endpoint and secret have been
verified in the target environment.

```bash
export AWS_REGION=ap-south-1
export STACK_NAME=trackmcp-refresh-scheduler-staging
export WORKER_URL=https://staging.example.com/api/internal/refresh/run
export WORKER_TOKEN_SECRET_ARN=arn:aws:secretsmanager:ap-south-1:123456789012:secret:trackmcp/refresh/worker
export FAILURE_ALARM_TOPIC_ARN=''

sam build --template-file template.yaml --build-dir .aws-sam/build
sam deploy --template-file .aws-sam/build/template.yaml \
  --stack-name "$STACK_NAME" --region "$AWS_REGION" \
  --capabilities CAPABILITY_IAM --resolve-s3 \
  --parameter-overrides WorkerUrl="$WORKER_URL" \
    WorkerTokenSecretArn="$WORKER_TOKEN_SECRET_ARN" \
    EnableSchedule=false FailureAlarmTopicArn="$FAILURE_ALARM_TOPIC_ARN"
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

The IAM role created by this template is limited to invoking this Lambda and
writing failed scheduler deliveries to its own DLQ. The Lambda receives the
refresh token through a Secrets Manager dynamic reference.
