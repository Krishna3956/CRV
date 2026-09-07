import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("./DashboardApp.tsx", import.meta.url),
  "utf8",
);

const incidentFixture = (state, overrides = {}) => ({
  id: `fixture-${state}`,
  workspace_id: "workspace-fixture",
  alert_id: `alert-${state}`,
  identity: `workspace-fixture|alert-${state}|tool_error_rate_spike|search|production`,
  metric: "tool_error_rate_spike",
  state,
  severity: state === "firing" ? "high" : "medium",
  scope: { tool_name: "search", environment: "production" },
  data_status: state === "insufficient_data" ? "insufficient" : "sufficient",
  baseline: { numerator: 2, denominator: 100, value: 0.02 },
  comparison: { numerator: 24, denominator: 120, value: 0.2 },
  threshold: { relative_increase: 2, minimum_volume: 50 },
  reasons: ["minimum_volume_met"],
  evidence: { comparison_volume: 120, bounded: true },
  first_seen_at: "2026-09-07T00:00:00Z",
  last_seen_at: "2026-09-07T00:05:00Z",
  acknowledged_at: null,
  resolved_at: state === "resolved" ? "2026-09-07T00:10:00Z" : null,
  suppressed_reason: state === "suppressed" ? "maintenance window" : null,
  recovery: state === "resolved" ? { recovered_at: "2026-09-07T00:10:00Z", value: 0.02 } : null,
  revision: 1,
  // Deliberately hostile fields: the dashboard must not render them.
  webhook_secret: "fixture-secret-do-not-render",
  raw_delivery_payload: { private: "fixture-payload-do-not-render" },
  unbounded_json: { nested: "fixture-unbounded-json-do-not-render" },
  ...overrides,
});

const incidents = [
  incidentFixture("pending"),
  incidentFixture("firing"),
  incidentFixture("resolved"),
  incidentFixture("suppressed"),
  incidentFixture("insufficient_data"),
  incidentFixture("invalid_configuration", { data_status: "invalid_configuration" }),
];

const responseFixtures = [
  { name: "unauthenticated", status: 401, body: { error: "Sign in or provide a workspace API key." } },
  { name: "permission denied", status: 403, body: { error: "You do not have permission to view regression incidents." } },
  { name: "generic error", status: 500, body: { error: "Could not load regression incidents." } },
];

function renderableIncident(incident) {
  return {
    id: incident.id,
    state: incident.state,
    severity: incident.severity,
    metric: incident.metric,
    scope: incident.scope,
    data_status: incident.data_status,
    baseline: incident.baseline,
    comparison: incident.comparison,
    threshold: incident.threshold,
    reasons: incident.reasons.slice(0, 3),
    first_seen_at: incident.first_seen_at,
    last_seen_at: incident.last_seen_at,
    resolved_at: incident.resolved_at,
    recovery: incident.recovery,
    last_delivered_at: incident.last_delivered_at,
  };
}

test("deterministic fixtures cover every incident lifecycle state and bounded evidence", () => {
  assert.deepEqual(
    incidents.map((incident) => incident.state),
    ["pending", "firing", "resolved", "suppressed", "insufficient_data", "invalid_configuration"],
  );
  const rendered = incidents.map(renderableIncident);
  const serialized = JSON.stringify(rendered);
  assert.equal(serialized.includes("fixture-secret-do-not-render"), false);
  assert.equal(serialized.includes("raw_delivery_payload"), false);
  assert.equal(serialized.includes("fixture-payload-do-not-render"), false);
  assert.equal(serialized.includes("unbounded_json"), false);
  assert.equal(serialized.includes("fixture-unbounded-json-do-not-render"), false);
  assert.ok(rendered.every((incident) => incident.reasons.length <= 3));
  assert.ok(rendered.every((incident) => incident.comparison.denominator <= 120));
  for (const label of [
    "Awaiting confirmation",
    "Firing regression",
    "Resolved",
    "Suppressed",
    "Insufficient evidence",
    "Configuration needs attention",
  ]) {
    assert.match(source, new RegExp(label.replace(/[.*+?^${}()|[\\]\\]/g, "\\\\$&")));
  }
  for (const field of ["Scope:", "Affected volume:", "Threshold:", "Baseline:", "Comparison:", "Evidence basis:", "Notification status:"]) {
    assert.match(source, new RegExp(field.replace(/[.*+?^${}()|[\\]\\]/g, "\\\\$&")));
  }
  for (const forbidden of ["webhook_secret", "raw_delivery_payload", "unbounded_json"]) {
    assert.doesNotMatch(source, new RegExp(forbidden));
  }
});

test("deterministic response fixtures cover loading, empty, 401, 403, and retry states", () => {
  assert.deepEqual(responseFixtures.map((fixture) => fixture.status), [401, 403, 500]);
  assert.match(source, /alertLoadState === "idle" \|\| alertLoadState === "loading"/);
  assert.match(source, /No regression incidents were returned for this workspace/);
  assert.match(source, /response\.status === 401 \|\| response\.status === 403/);
  assert.match(source, /You do not have permission to view regression incidents/);
  assert.match(source, /Regression incidents could not be loaded/);
  assert.match(source, /Retry/);
});
