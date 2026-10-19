import assert from "node:assert/strict";
import test from "node:test";
import { actionQueueFingerprint, actionQueueRuleForAlertMetric, relatedActionQueueFingerprint } from "./issue-identity.ts";
import { incidentRow } from "../alerts/persistence.ts";

test("maps only supported alert metrics to queue rules", () => {
  assert.equal(actionQueueRuleForAlertMetric("tool_error_rate_spike"), "high_tool_error_rate");
  assert.equal(actionQueueRuleForAlertMetric("workflow_completion_drop"), "workflow_outcomes_unresolved");
  assert.equal(actionQueueRuleForAlertMetric("p95_latency_regression"), null);
});

test("shared queue fingerprints are deterministic and bounded to a hash", () => {
  const first = actionQueueFingerprint("workspace-1", "high_tool_error_rate", "search");
  assert.equal(first, actionQueueFingerprint("workspace-1", "high_tool_error_rate", "search"));
  assert.match(first, /^[a-f0-9]{64}$/);
  assert.notEqual(first, actionQueueFingerprint("workspace-2", "high_tool_error_rate", "search"));
  assert.equal(relatedActionQueueFingerprint("workspace-1", "p95_latency_regression", "search"), null);
});

test("supported alert incidents carry the matching queue fingerprint as bounded evidence", () => {
  const row = incidentRow("workspace-1", "alert-1", {
    metric: "tool_error_rate_spike",
    severity: "warning",
    data_status: "sufficient",
    reasons: [],
    baseline: { numerator: 1, denominator: 30, value: 0.03, window: { start: "2026-09-01T00:00:00Z", end: "2026-09-02T00:00:00Z" } },
    comparison: { numerator: 10, denominator: 30, value: 0.33, window: { start: "2026-09-02T00:00:00Z", end: "2026-09-03T00:00:00Z" } },
    threshold: {},
    scope: { tool_name: "search", environment: "production" },
    evidence: {},
  });
  assert.deepEqual((row.evidence as Record<string, unknown>).action_queue_fingerprint, actionQueueFingerprint("workspace-1", "high_tool_error_rate", "search"));
});
