import assert from "node:assert/strict";
import test from "node:test";
import { transitionIncident } from "./lifecycle.ts";
import type { AlertIncident } from "./types.ts";
import type { RegressionFinding } from "../telemetry/regressions.ts";

function finding(severity: RegressionFinding["severity"], data_status: RegressionFinding["data_status"] = "sufficient"): RegressionFinding {
  const window = { start: "2026-09-06T00:00:00.000Z", end: "2026-09-07T00:00:00.000Z" };
  return { metric: "tool_error_rate_spike", severity, data_status, reasons: data_status === "sufficient" ? [] : ["truncated_scan"], baseline: { numerator: 1, denominator: 30, value: 0.03, window }, comparison: { numerator: 10, denominator: 30, value: 0.33, window }, threshold: {}, scope: { tool_name: "search", environment: "production" }, evidence: {} };
}

test("lifecycle fires, preserves active incidents through insufficient data, and recovers", () => {
  const first = transitionIncident("workspace", "alert", finding("warning"), null, new Date("2026-09-07T01:00:00Z"));
  assert.equal(first.state, "firing");
  const existing = { ...first, revision: 1 } as AlertIncident;
  const incomplete = transitionIncident("workspace", "alert", finding(null, "partial"), existing, new Date("2026-09-07T02:00:00Z"));
  assert.equal(incomplete.state, "firing");
  assert.equal(incomplete.data_status, "partial");
  const recovered = transitionIncident("workspace", "alert", finding(null), existing, new Date("2026-09-07T03:00:00Z"));
  assert.equal(recovered.state, "resolved");
  assert.ok(recovered.resolved_at);
});
