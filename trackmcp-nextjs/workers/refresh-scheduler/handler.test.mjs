import assert from "node:assert/strict";
import test from "node:test";
import { handler } from "./handler.mjs";

const ENDPOINT = "https://i95pzq2xh7.ap-south-1.awsapprunner.com/api/internal/refresh/run";

async function withEnvironment(values, callback) {
  const previous = new Map(Object.keys(values).map((key) => [key, process.env[key]]));
  try {
    for (const [key, value] of Object.entries(values)) process.env[key] = value;
    return await callback();
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test("scheduler handler sends one bounded authenticated refresh request", async () => {
  const previousFetch = globalThis.fetch;
  const previousLog = console.log;
  const requests = [];
  const logs = [];
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options });
    return { ok: true, status: 202 };
  };
  console.log = (line) => logs.push(line);
  try {
    const result = await withEnvironment({
      TRACKMCP_REFRESH_WORKER_URL: ENDPOINT,
      TRACKMCP_REFRESH_WORKER_TOKEN: "test-token-is-never-logged",
    }, () => handler({ source: "eventbridge_scheduler" }));
    assert.deepEqual(result, { statusCode: 202 });
    assert.equal(requests.length, 4);
    for (const request of requests) {
      assert.equal(request.url, ENDPOINT);
      assert.equal(request.options.method, "POST");
      assert.equal(request.options.redirect, "manual");
      assert.equal(request.options.headers.authorization, "Bearer test-token-is-never-logged");
      assert.equal(request.options.headers["content-type"], "application/json");
      assert.deepEqual(JSON.parse(request.options.body), { max_jobs: 10 });
      assert.ok(request.options.signal instanceof AbortSignal);
    }
    assert.equal(logs.length, 1);
    const marker = JSON.parse(logs[0]);
    assert.equal(marker.event, "refresh_scheduler_result");
    assert.equal(marker.scheduled, true);
    assert.equal(marker.success, true);
    assert.equal(marker.ScheduledSuccess, 1);
    assert.equal(marker.WorkerSummarySample, 1);
    assert.equal(marker.WorkerSummaryComplete, 0);
    assert.equal(marker.WorkerSummaryParseFailures, 4);
    assert.equal(marker.WorkerProcessed, 0);
    assert.equal(marker.WorkerMaxQueueLagMs, 0);
    assert.equal(marker._aws.CloudWatchMetrics[0].Namespace, "TrackMCP/RefreshScheduler");
    assert.deepEqual(marker._aws.CloudWatchMetrics[0].Dimensions, [["FunctionName"]]);
    assert.equal(marker._aws.CloudWatchMetrics[0].Metrics[0].Name, "ScheduledSuccess");
    assert.equal(marker.request, undefined);
  } finally {
    globalThis.fetch = previousFetch;
    console.log = previousLog;
  }
});

test("scheduler emits bounded worker freshness metrics without logging response content", async () => {
  const previousFetch = globalThis.fetch;
  const previousLog = console.log;
  const logs = [];
  globalThis.fetch = async () => new Response(JSON.stringify({
    processed: 2,
    succeeded: 2,
    retryable: 0,
    failed: 0,
    max_queue_lag_ms: 420,
    owner: "must-not-be-logged",
    errors: ["must-not-be-logged"],
  }), { status: 200, headers: { "content-type": "application/json" } });
  console.log = (line) => logs.push(line);
  try {
    await withEnvironment({
      TRACKMCP_REFRESH_WORKER_URL: ENDPOINT,
      TRACKMCP_REFRESH_WORKER_TOKEN: "test-token",
    }, () => handler({ source: "eventbridge_scheduler" }));
    assert.equal(logs.length, 1);
    const marker = JSON.parse(logs[0]);
    assert.equal(marker.WorkerSummarySample, 1);
    assert.equal(marker.WorkerSummaryComplete, 1);
    assert.equal(marker.WorkerSummaryParseFailures, 0);
    assert.equal(marker.WorkerProcessed, 8);
    assert.equal(marker.WorkerSucceeded, 8);
    assert.equal(marker.WorkerRetryable, 0);
    assert.equal(marker.WorkerFailed, 0);
    assert.equal(marker.WorkerMaxQueueLagMs, 420);
    assert.doesNotMatch(logs[0], /must-not-be-logged/);
    assert.doesNotMatch(logs[0], /owner|errors/);
  } finally {
    globalThis.fetch = previousFetch;
    console.log = previousLog;
  }
});

test("scheduler handler fails closed when configuration is incomplete", async () => {
  await withEnvironment({
    TRACKMCP_REFRESH_WORKER_URL: "",
    TRACKMCP_REFRESH_WORKER_TOKEN: "",
  }, async () => {
    await assert.rejects(handler(), /refresh worker is not configured/);
  });
});

test("scheduler handler reports upstream status without reading response content", async () => {
  const previousFetch = globalThis.fetch;
  const previousLog = console.log;
  const logs = [];
  globalThis.fetch = async () => ({
    ok: false,
    status: 503,
    get body() { throw new Error("response content must not be read"); },
  });
  console.log = (line) => logs.push(line);
  try {
    await withEnvironment({
      TRACKMCP_REFRESH_WORKER_URL: ENDPOINT,
      TRACKMCP_REFRESH_WORKER_TOKEN: "test-token",
    }, async () => {
      await assert.rejects(handler({ source: "eventbridge_scheduler" }), /refresh worker returned HTTP 503/);
    });
    const marker = JSON.parse(logs[0]);
    assert.equal(marker.success, false);
    assert.equal(marker.ScheduledFailure, 1);
    assert.equal(marker.FailureClass, "upstream_http");
    assert.doesNotMatch(logs[0], /response content|test-token/);
  } finally {
    globalThis.fetch = previousFetch;
    console.log = previousLog;
  }
});

test("manual invocations do not emit the scheduled-success marker", async () => {
  const previousFetch = globalThis.fetch;
  const previousLog = console.log;
  const logs = [];
  let requestCount = 0;
  globalThis.fetch = async () => { requestCount += 1; return { ok: true, status: 200 }; };
  console.log = (line) => logs.push(line);
  try {
    await withEnvironment({
      TRACKMCP_REFRESH_WORKER_URL: ENDPOINT,
      TRACKMCP_REFRESH_WORKER_TOKEN: "test-token",
    }, () => handler({}));
    assert.deepEqual(logs, []);
    assert.equal(requestCount, 1);
  } finally {
    globalThis.fetch = previousFetch;
    console.log = previousLog;
  }
});
