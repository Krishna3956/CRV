# TrackMCP alert scheduler

This small Node.js 22 Lambda is the separately monitored EventBridge Scheduler
invoker for the App Runner alert evaluator. It calls the authenticated internal
`POST /api/internal/alerts/evaluate` route once per hour. Lambda errors and
timeouts remain visible in CloudWatch and EventBridge metrics; the handler never
logs the worker token or response body.

The SAM schedule is disabled by default. Before enabling it, configure the same
random worker token as `TRACKMCP_ALERT_WORKER_TOKEN` in App Runner and store it
as `SecretString` in the supplied Secrets Manager secret. Deploy this worker as
a separate AWS stack, then run a staging shadow evaluation before enabling
delivery. EventBridge retries an invocation failure; the database lease and
unique evaluation/delivery keys make retries safe.
