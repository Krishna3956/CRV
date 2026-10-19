import assert from "node:assert/strict";
import test from "node:test";
import { parseArgs, runFixtureProfiles, summarize } from "./activation-load-harness.mjs";

test("activation harness is local-only and bounded", () => {
  assert.throws(() => parseArgs(["--base-url", "https://trackmcp.com"]), /Refusing non-local/);
  assert.throws(() => parseArgs(["--requests", "2001"]), /1\.\.2000/);
  assert.equal(parseArgs(["--requests", "2", "--concurrency", "8"]).concurrency, 2);
});

test("harness reports separate ingest and activation profiles", async () => {
  const report = await runFixtureProfiles({ requests: 12, concurrency: 4, timeoutMs: 1000, p95Ms: 750, maxErrorRate: 0 });
  assert.equal(report.ingest.pass, true);
  assert.equal(report.activation.pass, true);
  assert.equal(report.ingest.errors, 0);
  assert.equal(report.activation.errors, 0);
});

test("failed or timed-out samples fail the budget", () => {
  const report = summarize([{ status: 500, latencyMs: 10, timedOut: false, error: "server" }], { p95Ms: 100, maxErrorRate: 0 });
  assert.equal(report.pass, false);
});
