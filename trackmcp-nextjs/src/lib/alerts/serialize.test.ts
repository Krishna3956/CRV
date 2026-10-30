import assert from "node:assert/strict";
import test from "node:test";
import { incidentEvidenceKind, serializeIncident } from "./serialize.ts";

test("incident evidence classification is fail-closed to customer evidence", () => {
  assert.equal(incidentEvidenceKind({ environment: "production", identity: "workspace|alert|metric" }), "customer");
  assert.equal(incidentEvidenceKind({ environment: "canary", identity: "workspace|alert|metric" }), "synthetic");
  assert.equal(incidentEvidenceKind({ environment: "production", identity: "p1-05-canary-probe|alert" }), "synthetic");
  assert.equal(incidentEvidenceKind({ environment: "canary", identity: null }), "synthetic");
});

test("serialized incidents always expose a bounded evidence kind", () => {
  const incident = serializeIncident({
    id: "incident",
    workspace_id: "workspace",
    alert_id: "alert",
    identity: "workspace|alert|metric",
    metric: "tool_error_rate_spike",
    state: "firing",
    severity: "warning",
    environment: "production",
    data_status: "sufficient",
    first_seen_at: "2026-10-29T00:00:00Z",
    last_seen_at: "2026-10-29T00:00:00Z",
  });
  assert.equal(incident.evidence_kind, "customer");
  assert.deepEqual(incident.scope, { tool_name: null, environment: "production" });
});

test("serialized rate incidents expose observed affected and eligible volumes", () => {
  const incident = serializeIncident({
    id: "incident",
    workspace_id: "workspace",
    alert_id: "alert",
    identity: "identity",
    metric: "tool_error_rate_spike",
    state: "firing",
    severity: "warning",
    tool_name: "search",
    environment: "production",
    data_status: "sufficient",
    baseline: { numerator: 1, denominator: 30, value: 0.03, window: { start: "a", end: "b" } },
    comparison: { numerator: 9, denominator: 40, value: 0.225, window: { start: "b", end: "c" } },
    threshold: {},
    reasons: [],
    evidence: {},
    first_seen_at: "2026-09-07T00:00:00Z",
    last_seen_at: "2026-09-07T00:00:00Z",
    revision: 1,
  });
  assert.equal(incident.affected_volume, 9);
  assert.equal(incident.eligible_volume, 40);
  assert.equal(incident.volume_basis, "comparison_numerator");
});

test("serialized latency incidents do not invent an affected volume", () => {
  const incident = serializeIncident({
    id: "incident",
    workspace_id: "workspace",
    alert_id: "alert",
    identity: "identity",
    metric: "p95_latency_regression",
    state: "firing",
    severity: "warning",
    data_status: "sufficient",
    comparison: { numerator: 40, denominator: 40, value: 800, window: { start: "b", end: "c" } },
    evidence: { affected_volume: 99 },
    first_seen_at: "2026-09-07T00:00:00Z",
    last_seen_at: "2026-09-07T00:00:00Z",
    revision: 1,
  });
  assert.equal(incident.affected_volume, null);
  assert.equal(incident.eligible_volume, 40);
  assert.equal(incident.volume_basis, "not_defined");
});
