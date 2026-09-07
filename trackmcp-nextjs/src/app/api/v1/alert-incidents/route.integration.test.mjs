import assert from "node:assert/strict";
import test from "node:test";
import { createAlertIncidentsHandler } from "./route.ts";

function incident(overrides = {}) {
  return {
    id: "incident-a",
    workspace_id: "workspace-a",
    alert_id: "alert-a",
    identity: "workspace-a|alert-a|tool_error_rate_spike|search|production",
    metric: "tool_error_rate_spike",
    state: "firing",
    severity: "high",
    tool_name: "search",
    environment: "production",
    data_status: "sufficient",
    baseline: { value: 0.02, volume: 100 },
    comparison: { value: 0.2, volume: 120 },
    threshold: { relative_increase: 2, minimum_volume: 50 },
    reasons: ["error rate increased"],
    evidence: { affected_volume: 24, comparison_volume: 120 },
    first_seen_at: "2026-09-07T00:00:00Z",
    last_seen_at: "2026-09-07T00:05:00Z",
    acknowledged_at: null,
    resolved_at: null,
    suppressed_reason: null,
    recovery: null,
    revision: 1,
    // These fields model data that must never cross the response boundary.
    webhook_secret: "webhook-secret-must-not-leak",
    raw_webhook_payload: { private: "payload-must-not-leak" },
    unbounded_json: { nested: "private-unbounded-record" },
    ...overrides,
  };
}

function fakeAdmin(rows) {
  return {
    from(table) {
      assert.equal(table, "trackmcp_alert_incidents");
      const filters = {};
      const query = {
        selected: "",
        limitValue: 50,
        select(value) { this.selected = value; return this; },
        eq(field, value) { filters[field] = value; return this; },
        order() { return this; },
        limit(value) { this.limitValue = value; return this; },
        then(resolve, reject) {
          const scoped = rows.filter((row) => Object.entries(filters).every(([field, value]) => row[field] === value));
          return Promise.resolve({ data: scoped.slice(0, this.limitValue), error: null }).then(resolve, reject);
        },
      };
      return query;
    },
  };
}

function authenticated(workspaceId, admin) {
  return async () => ({ admin, workspaceId });
}

test("alert-incidents rejects unauthenticated requests", async () => {
  const handler = createAlertIncidentsHandler(async () => ({ response: Response.json({ error: "Sign in or provide a workspace API key." }, { status: 401 }) }));
  const response = await handler(new Request("http://alerts.test/api/v1/alert-incidents"));
  assert.equal(response.status, 401);
});

test("alert-incidents is workspace scoped and clamps excessive pagination", async () => {
  const rows = [
    ...Array.from({ length: 105 }, (_, index) => incident({ id: `workspace-a-${index}` })),
    incident({ id: "workspace-b-secret", workspace_id: "workspace-b", identity: "workspace-b-secret" }),
  ];
  const admin = fakeAdmin(rows);
  const handler = createAlertIncidentsHandler(authenticated("workspace-a", admin));
  const response = await handler(new Request("http://alerts.test/api/v1/alert-incidents?limit=999"));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.limit, 100);
  assert.equal(body.data.length, 100);
  assert.equal(body.data.some((row) => row.id === "workspace-b-secret"), false);
  assert.equal(body.data.every((row) => row.workspace_id === "workspace-a"), true);
});

test("alert-incidents serializes bounded safe fields without secrets, webhook payloads, or unbounded JSON", async () => {
  const handler = createAlertIncidentsHandler(authenticated("workspace-a", fakeAdmin([incident({ evidence: { oversized: "x".repeat(40_000) } })])));
  const response = await handler(new Request("http://alerts.test/api/v1/alert-incidents?limit=1"));
  assert.equal(response.status, 200);
  const body = await response.json();
  const serialized = JSON.stringify(body);
  assert.equal(serialized.includes("webhook_secret"), false);
  assert.equal(serialized.includes("webhook-secret-must-not-leak"), false);
  assert.equal(serialized.includes("raw_webhook_payload"), false);
  assert.equal(serialized.includes("payload-must-not-leak"), false);
  assert.equal(serialized.includes("unbounded_json"), false);
  assert.equal(serialized.includes("private-unbounded-record"), false);
  assert.ok(serialized.length < 40_000);
  assert.ok(Object.hasOwn(body.data[0], "evidence"));
});
