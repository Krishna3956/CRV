# TrackMCP alert scheduler

This small Node.js 22 Lambda is the separately monitored EventBridge Scheduler
invoker for the App Runner alert evaluator. It calls the authenticated internal
`POST /api/internal/alerts/evaluate` route once per hour. Lambda errors and
timeouts remain visible in CloudWatch and EventBridge metrics; the handler never
logs the worker token or response body.

The template uses `AWS::Scheduler::Schedule`, not a legacy EventBridge Rule. It
sets an explicit one-hour maximum event age, two scheduler retry attempts, and
a bounded SQS dead-letter queue. Lambda and DLQ CloudWatch alarms are created;
alarm actions remain disabled unless an SNS topic ARN is supplied.

The schedule is disabled by default. Before enabling it, configure the same
random worker token as `TRACKMCP_ALERT_WORKER_TOKEN` in App Runner and store it
as `SecretString` in the supplied Secrets Manager secret. Deploy this worker as
a separate AWS stack, then run a staging shadow evaluation before enabling
delivery. Enable `EnableSchedule=true` only after verifying the exact
`EvaluatorUrl`, secret reference, Lambda invocation permission, retry/DLQ
metrics, and authenticated evaluator response. The Lambda invokes the
authenticated App Runner evaluator URL; it does not query the database
directly. The database lease and unique evaluation/delivery keys make retries
safe.

Webhook destination validation performs a DNS lookup and then fetches with
redirects disabled. DNS is a check-then-fetch defense, not a proof that a
public hostname cannot change between those operations; deploy with normal
egress controls and revalidate destinations immediately before delivery.
Only trusted public HTTPS endpoints are supported. Email destinations remain
disabled in this increment.
