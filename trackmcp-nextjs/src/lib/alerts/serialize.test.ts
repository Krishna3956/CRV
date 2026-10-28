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
