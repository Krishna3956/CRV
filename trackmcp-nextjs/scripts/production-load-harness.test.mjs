import test from "node:test";
import assert from "node:assert/strict";
import { parseArgs, summarize } from "./production-load-harness.mjs";

test("harness rejects unsafe remote targets and bounds workload", () => {
  assert.throws(() => parseArgs(["--base-url", "https://trackmcp.com"]), /Refusing non-local/);
  assert.throws(() => parseArgs(["--requests", "10001"]), /1\.\.10000/);
  assert.throws(() => parseArgs(["--timeout-ms", "0"]), /--timeout-ms must be 1\.\.120000/);
  assert.equal(parseArgs(["--timeout-ms", "2500"]).timeoutMs, 2500);
  assert.equal(parseArgs(["--requests", "2", "--concurrency", "8"]).concurrency, 2);
});

test("summary enforces latency, error, and tenant-isolation budgets", () => {
  const report = summarize([
    { route: "/api/v2/tools", status: 200, latencyMs: 20, isolation: true },
    { route: "/api/v1/ingest", status: 202, latencyMs: 30, isolation: true },
    { route: "/api/v2/tools", status: 200, latencyMs: 40, isolation: true },
  ], Date.now() - 100, { p95Ms: 100, maxErrorRate: 0, concurrency: 2 });
  assert.equal(report.pass, true);
  assert.equal(report.byRoute["/api/v2/tools"].requests, 2);
  assert.deepEqual(report.statusClasses, { successful: 3, clientErrors: 0, serverErrors: 0, otherHttp: 0, transportErrors: 0 });

  const failed = summarize([{ route: "/api/v2/tools", status: 200, latencyMs: 200, isolation: false }], Date.now(), { p95Ms: 100, maxErrorRate: 0, concurrency: 1 });
  assert.equal(failed.pass, false);
  assert.equal(failed.tenantIsolationFailures, 1);

  const timedOut = summarize([{ route: "/api/v2/tools", status: 0, latencyMs: 100, error: "request timed out", timedOut: true, isolation: true }], Date.now(), { p95Ms: 200, maxErrorRate: 1, concurrency: 1 });
  assert.equal(timedOut.timeouts, 1);
  assert.equal(timedOut.statusClasses.transportErrors, 1);
  assert.equal(timedOut.checks.noTimeouts, false);
  assert.equal(timedOut.pass, false);

  const statusSplit = summarize([
    { route: "/api/v1/ingest", status: 400, latencyMs: 10, isolation: true },
    { route: "/api/v1/ingest", status: 503, latencyMs: 10, isolation: true },
  ], Date.now(), { p95Ms: 100, maxErrorRate: 1, concurrency: 1 });
  assert.equal(statusSplit.statusClasses.clientErrors, 1);
  assert.equal(statusSplit.statusClasses.serverErrors, 1);
});
