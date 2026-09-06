import assert from "node:assert/strict";
import test from "node:test";
import { transitionIncident } from "./lifecycle.ts";
import { deliveryIsDue } from "./persistence.ts";
import type { AlertIncident } from "./types.ts";
import type { RegressionFinding } from "../telemetry/regressions.ts";

function finding(severity: RegressionFinding["severity"], data_status: RegressionFinding["data_status"] = "sufficient"): RegressionFinding {
  const window = { start: "2026-09-06T00:00:00.000Z", end: "2026-09-07T00:00:00.000Z" };
  return { metric: "tool_error_rate_spike", severity, data_status, reasons: data_status === "sufficient" ? [] : ["truncated_scan"], baseline: { numerator: 1, denominator: 30, value: 0.03, window }, comparison: { numerator: 10, denominator: 30, value: 0.33, window }, threshold: {}, scope: { tool_name: "search", environment: "production" }, evidence: {} };
}

test("lifecycle requires a pending observation before firing, preserves active incidents, and recovers", () => {
  const first = transitionIncident("workspace", "alert", finding("warning"), null, new Date("2026-09-07T01:00:00Z"));
  assert.equal(first.state, "pending");
  const existing = { ...first, revision: 1 } as AlertIncident;
  const firing = transitionIncident("workspace", "alert", finding("warning"), existing, new Date("2026-09-07T02:00:00Z"));
  assert.equal(firing.state, "firing");
  const incomplete = transitionIncident("workspace", "alert", finding(null, "partial"), { ...firing, revision: 2 } as AlertIncident, new Date("2026-09-07T02:30:00Z"));
  assert.equal(incomplete.state, "firing");
  assert.equal(incomplete.data_status, "partial");
  const recovered = transitionIncident("workspace", "alert", finding(null), { ...firing, revision: 2 } as AlertIncident, new Date("2026-09-07T03:00:00Z"));
  assert.equal(recovered.state, "resolved");
  assert.ok(recovered.resolved_at);
});

test("delivery cooldown suppresses duplicate firing and permits recovery", () => {
  const pending = { ...transitionIncident("workspace", "alert", finding("warning"), null, new Date("2026-09-07T00:00:00Z")), id: "incident", state: "pending", last_delivered_at: null } as AlertIncident;
  const firing = { ...transitionIncident("workspace", "alert", finding("warning"), pending, new Date("2026-09-07T01:00:00Z")), id: "incident", state: "firing", last_delivered_at: "2026-09-07T01:00:00.000Z" } as AlertIncident;
  assert.equal(deliveryIsDue(firing, { ...firing, last_seen_at: "2026-09-07T02:00:00.000Z" }, new Date("2026-09-07T02:00:00Z")), false);
  assert.equal(deliveryIsDue(firing, { ...firing, last_seen_at: "2026-09-07T08:00:00.000Z" }, new Date("2026-09-07T08:00:00Z")), true);
  const recovered = { ...firing, state: "resolved" } as AlertIncident;
  assert.equal(deliveryIsDue(firing, recovered, new Date("2026-09-07T03:00:00Z")), true);
});
