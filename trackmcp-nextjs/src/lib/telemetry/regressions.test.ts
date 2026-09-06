import assert from "node:assert/strict";
import test from "node:test";
import { evaluateRegressions, MIN_ELIGIBLE_CALLS, MIN_WORKFLOW_STARTS, regressionWindows, type RegressionEvent } from "./regressions.ts";

const NOW = new Date("2026-09-07T12:00:00.000Z");

function call(id: string, startedAt: string, overrides: Record<string, unknown> = {}): RegressionEvent {
  return {
    event_id: id,
    event_type: "tool_call",
    observation_source: "server" as const,
    tool_name: "search",
    environment: "production",
    started_at: startedAt,
    success: true,
    is_error: false,
    duration_ms: 100,
    retry_number: 0,
    payload_policy: "redacted",
    payload: { result: { item: "value" } },
    ...overrides,
  };
}

function at(day: string, index: number) { return `2026-09-${day}T00:${String(index % 60).padStart(2, "0")}:00.000Z`; }

function baseEvents() {
  return [
    ...Array.from({ length: MIN_ELIGIBLE_CALLS }, (_, index) => call(`baseline-${index}`, at("02", index), { is_error: index < 4, success: index >= 4 })),
    ...Array.from({ length: MIN_ELIGIBLE_CALLS }, (_, index) => call(`current-${index}`, at("06", index), { is_error: index < 16, success: index >= 16, duration_ms: 200 })),
  ];
}

test("uses complete UTC days, includes the full seven-day baseline, and excludes the current day", () => {
  assert.deepEqual(regressionWindows(NOW), {
    baseline: { start: "2026-08-30T00:00:00.000Z", end: "2026-09-06T00:00:00.000Z" },
    comparison: { start: "2026-09-06T00:00:00.000Z", end: "2026-09-07T00:00:00.000Z" },
  });
  const events = baseEvents().concat(Array.from({ length: 40 }, (_, index) => call(`partial-${index}`, "2026-09-07T01:00:00.000Z", { is_error: true, success: false })));
  const finding = evaluateRegressions(events, { now: NOW, metric: "tool_error_rate_spike" })[0];
  assert.equal(finding.comparison.denominator, 30);
  assert.equal(finding.comparison.numerator, 16);
});

test("regression evaluator calculates error, p95, retry, and empty-result comparisons", () => {
  const events = baseEvents().map((event, index) => index === 30 ? { ...event, payload: { result: [] } } : event);
  const findings = evaluateRegressions(events, { now: NOW });
  const errors = findings.find((finding) => finding.metric === "tool_error_rate_spike")!;
  assert.equal(errors.baseline.numerator, 4);
  assert.equal(errors.baseline.denominator, 30);
  assert.equal(errors.comparison.numerator, 16);
  assert.equal(errors.comparison.denominator, 30);
  assert.equal(errors.severity, "critical");
  const latency = findings.find((finding) => finding.metric === "p95_latency_regression")!;
  assert.equal(latency.baseline.value, 100);
  assert.equal(latency.comparison.value, 200);
  assert.equal(latency.severity, "warning");
  const empty = findings.find((finding) => finding.metric === "empty_result_spike")!;
  assert.equal(empty.baseline.denominator, 26);
  assert.equal(empty.comparison.denominator, 14);
});

test("minimum volume and partial scans never produce numeric firing metrics", () => {
  const insufficient = evaluateRegressions(Array.from({ length: MIN_ELIGIBLE_CALLS - 1 }, (_, index) => call(`small-${index}`, at("06", index))), { now: NOW });
  const error = insufficient.find((finding) => finding.metric === "tool_error_rate_spike")!;
  assert.equal(error.data_status, "insufficient_data");
  assert.equal(error.severity, null);
  assert.ok(error.reasons.includes("below_minimum_volume"));
  const partial = evaluateRegressions(baseEvents(), { now: NOW, truncated: true });
  assert.ok(partial.every((finding) => finding.data_status === "partial"));
  assert.ok(partial.every((finding) => finding.severity === null));
});

test("only explicit retry metadata and inspectable payloads are eligible", () => {
  const events = baseEvents().map((event, index) => index >= 30 && index < 35 ? { ...event, retry_number: 1 } : index === 0 ? { ...event, payload_policy: "metadata", payload: { result: [] } } : index === 1 ? { ...event, payload_policy: "unavailable", payload: { result: [] } } : index === 2 ? { ...event, payload_policy: "truncated", payload: { result: [], truncated: true } } : event);
  const retry = evaluateRegressions(events, { now: NOW, metric: "retry_loop_spike" })[0];
  assert.equal(retry.comparison.numerator, 5);
  assert.equal(retry.comparison.denominator, 30);
  const empty = evaluateRegressions(events, { now: NOW, metric: "empty_result_spike" })[0];
  assert.equal(empty.baseline.numerator, 0);
  assert.equal(empty.baseline.denominator, 26);
});

test("workflow completion uses only explicit lifecycle outcomes", () => {
  const events = [...baseEvents()];
  for (let index = 0; index < MIN_WORKFLOW_STARTS; index += 1) {
    events.push({ event_id: `workflow-baseline-start-${index}`, event_type: "workflow", observation_source: "server", workflow_id: `baseline-${index}`, started_at: at("01", index), payload: { name: "workflow", workflow_name: "run", status: "started" } });
    events.push({ event_id: `workflow-baseline-end-${index}`, event_type: "workflow", observation_source: "server", workflow_id: `baseline-${index}`, started_at: at("02", index), payload: { name: "workflow", workflow_name: "run", status: index < 18 ? "completed" : "failed" } });
    events.push({ event_id: `workflow-current-start-${index}`, event_type: "workflow", observation_source: "server", workflow_id: `current-${index}`, started_at: at("06", index), payload: { name: "workflow", workflow_name: "run", status: "started" } });
    events.push({ event_id: `workflow-current-end-${index}`, event_type: "workflow", observation_source: "server", workflow_id: `current-${index}`, started_at: at("06", index + 1), payload: { name: "workflow", workflow_name: "run", status: index < 10 ? "completed" : "failed" } });
  }
  const finding = evaluateRegressions(events, { now: NOW, metric: "workflow_completion_drop" })[0];
  assert.equal(finding.baseline.value, 0.9);
  assert.equal(finding.comparison.value, 0.5);
  assert.equal(finding.severity, "critical");
});

test("client and legacy observations cannot inflate server-only findings", () => {
  const events = baseEvents().concat(baseEvents().map((event) => ({ ...event, event_id: `client-${event.event_id}`, observation_source: "client" as const, is_error: true, success: false })));
  const finding = evaluateRegressions(events, { now: NOW, metric: "tool_error_rate_spike" })[0];
  assert.equal(finding.comparison.denominator, 30);
  assert.equal(finding.comparison.numerator, 16);
});

test("catalog drift and deployment comparisons require bounded server evidence", () => {
  const catalog = [
    { event_id: "catalog-before", event_type: "catalog", observation_source: "server" as const, tool_name: null, started_at: at("02", 0), payload: { name: "tools_discovered", tools: [{ name: "search", tool_description_hash: "description-a", schema_hash: "schema-a" }] } },
    { event_id: "catalog-after", event_type: "catalog", observation_source: "server" as const, tool_name: null, started_at: at("06", 0), payload: { name: "tools_discovered", tools: [{ name: "search", tool_description_hash: "description-b", schema_hash: "schema-a" }] } },
  ];
  const catalogCalls = [
    ...Array.from({ length: 30 }, (_, index) => call(`catalog-before-call-${index}`, at("02", index))),
    ...Array.from({ length: 30 }, (_, index) => call(`catalog-after-call-${index}`, at("06", index))),
  ];
  const catalogFinding = evaluateRegressions([...catalog, ...catalogCalls], { now: NOW, metric: "catalog_description_drift", toolName: "search" })[0];
  assert.equal(catalogFinding.severity, "warning");
  assert.equal(catalogFinding.baseline.denominator, 30);
  assert.equal(catalogFinding.comparison.denominator, 30);

  const deployments = [
    ...Array.from({ length: 30 }, (_, index) => call(`deployment-a-${index}`, at("02", index), { deployment_id: "deployment-a" })),
    ...Array.from({ length: 30 }, (_, index) => call(`deployment-b-${index}`, at("06", index), { deployment_id: "deployment-b", is_error: index < 10, success: index >= 10 })),
  ];
  const deploymentFinding = evaluateRegressions(deployments, { now: NOW, metric: "deployment_comparison", toolName: "search" })[0];
  assert.equal(deploymentFinding.evidence.previous_deployment_id, "deployment-a");
  assert.equal(deploymentFinding.evidence.comparison_deployment_id, "deployment-b");
  assert.equal(deploymentFinding.severity, "critical");
});

test("authorization alerts only count explicit authorization attempts and canonical failures", () => {
  const events = [
    ...Array.from({ length: 30 }, (_, index) => ({ ...call(`auth-before-${index}`, at("02", index)), event_type: "protocol", payload: { authorization_attempt: true }, error_code: index < 2 ? 401 : null, is_error: index < 2, success: index >= 2 })),
    ...Array.from({ length: 30 }, (_, index) => ({ ...call(`auth-current-${index}`, at("06", index)), event_type: "protocol", payload: { authorization_attempt: true }, error_code: index < 10 ? 401 : null, is_error: index < 10, success: index >= 10 })),
  ];
  const finding = evaluateRegressions(events, { now: NOW, metric: "authorization_failure_spike" })[0];
  assert.equal(finding.baseline.denominator, 30);
  assert.equal(finding.baseline.numerator, 2);
  assert.equal(finding.comparison.numerator, 10);
  assert.equal(finding.severity, "critical");
});

test("workflow and authorization findings honor server, tool, and environment scope", () => {
  const workflowEvents = [
    { event_id: "workflow-good-start", event_type: "workflow", observation_source: "server" as const, workflow_id: "good", tool_name: "search", environment: "production", started_at: at("06", 0), payload: { name: "workflow", status: "started", tool_name: "search" } },
    { event_id: "workflow-good-end", event_type: "workflow", observation_source: "server" as const, workflow_id: "good", tool_name: "search", environment: "production", started_at: at("06", 1), payload: { name: "workflow", status: "completed", tool_name: "search" } },
    { event_id: "workflow-other-start", event_type: "workflow", observation_source: "server" as const, workflow_id: "other", tool_name: "other", environment: "production", started_at: at("06", 2), payload: { name: "workflow", status: "started", tool_name: "other" } },
    { event_id: "workflow-other-end", event_type: "workflow", observation_source: "server" as const, workflow_id: "other", tool_name: "other", environment: "production", started_at: at("06", 3), payload: { name: "workflow", status: "failed", tool_name: "other" } },
  ];
  const finding = evaluateRegressions(workflowEvents, { now: NOW, metric: "workflow_completion_drop", toolName: "search", environment: "production" })[0];
  assert.equal(finding.baseline.denominator, 0);
  assert.equal(finding.comparison.denominator, 1);
});
