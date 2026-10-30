import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflow = await readFile(new URL("../../.github/workflows/founder-os-refresh-health.yml", import.meta.url), "utf8");

test("health workflow can recover a missed worker tick without overlapping an active run", () => {
  assert.match(workflow, /actions: write/);
  assert.match(workflow, /id-token: write/);
  assert.match(workflow, /configure-aws-credentials@v4/);
  assert.match(workflow, /cloudwatch get-metric-data/);
  assert.match(workflow, /TrackMCP\/RefreshScheduler/);
  assert.match(workflow, /ScheduledSuccess/);
  assert.match(workflow, /ScheduledFailure/);
  assert.match(workflow, /scheduled_failures/);
  assert.match(workflow, /scheduled_successes/);
  assert.doesNotMatch(workflow, /logs filter-log-events/);
  assert.match(workflow, /aws-scheduler\.json/);
  assert.match(workflow, /OutputKey==`RefreshSchedulerFunctionArn`/);
  assert.match(workflow, /scheduler_evidence/);
  assert.match(workflow, /scheduled_cadence_gate/);
  assert.match(workflow, /aws_scheduler_cadence_gate/);
  assert.match(workflow, /founder-os-refresh-worker\.yml\/runs\?status=in_progress/);
  assert.match(workflow, /founder-os-refresh-worker\.yml\/dispatches/);
  assert.match(workflow, /Recovery dispatch: requested/);
  assert.match(workflow, /Recovery dispatch: skipped/);
  assert.match(workflow, /status=completed&per_page=1/);
  assert.match(workflow, /latest_age.*1200/);
  assert.match(workflow, /completed within the 20-minute cooldown/);
  assert.doesNotMatch(workflow, /echo \"- State: `\$state`\"/);
  assert.match(workflow, /--data '\{"ref":"main"\}'/);
});

test("health workflow reads bounded AWS worker freshness metrics", () => {
  for (const metric of ["WorkerSummarySample", "WorkerSummaryComplete", "WorkerSummaryParseFailures", "WorkerProcessed", "WorkerFailed", "WorkerRetryable", "WorkerMaxQueueLagMs"]) {
    assert.match(workflow, new RegExp(metric));
  }
  assert.match(workflow, /worker_summary:/);
  assert.match(workflow, /AWS worker freshness gate:/);
  assert.match(workflow, /Latest AWS metric timestamp/);
  assert.match(workflow, /Max queue-lag metric timestamp/);
});
