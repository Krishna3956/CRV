import assert from "node:assert/strict";
import test from "node:test";
import { createAnalyticsHandler } from "./route.ts";

function fakeAdmin(rows) {
  return {
    from(table) {
      if (table === "trackmcp_api_keys") {
        return { select() { return this; }, eq() { return this; }, maybeSingle: async () => ({ data: { workspace_id: "workspace-a", revoked_at: null }, error: null }) };
      }
      const filters = {};
      const query = {
        select() { return this; },
        eq(field, value) { filters[field] = value; return this; },
        gte() { return this; },
        order() { return this; },
        limit() { return Promise.resolve({ data: rows.filter((row) => row.workspace_id === filters.workspace_id), error: null }); },
      };
      return query;
    },
  };
}

function event(overrides = {}) {
  return {
    workspace_id: "workspace-a",
    schema_version: "1",
    event_type: "custom",
    service: "analytics-test",
    environment: "test",
    started_at: "2026-09-06T00:00:00Z",
    intent_source: "missing",
    context: null,
    missing_capability: null,
    correlation_handle_source: "missing",
    correlation_handle: null,
    payload: {},
    ...overrides,
  };
}

test("analytics response exposes intent provenance and missing capabilities with workspace scoping", async () => {
  const handler = createAnalyticsHandler(() => fakeAdmin([
    event({ event_id: "external", context: "Resolve the deployment issue", intent_source: "external_callback", missing_capability: "bulk_export", correlation_handle: "job_1", correlation_handle_source: "external" }),
    event({ event_id: "fallback", context: "Find the record", intent_source: "fallback" }),
    event({ event_id: "missing", intent_source: "missing" }),
    event({ workspace_id: "workspace-b", event_id: "foreign", context: "foreign", intent_source: "context_parameter", missing_capability: "hidden" }),
  ]), async () => ({ auth: { getUser: async () => ({ data: { user: null } }) } }));
  const response = await handler(new Request("http://analytics.test/api/v1/analytics?days=7", { headers: { authorization: "Bearer key" } }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body.intent_sources, { context_parameter: 0, external_callback: 1, fallback: 1, missing: 1 });
  assert.deepEqual(body.missing_capabilities, [{ name: "bulk_export", reports: 1 }]);
  assert.equal(JSON.stringify(body).includes("hidden"), false);
});

test("analytics authentication remains required", async () => {
  const handler = createAnalyticsHandler(() => fakeAdmin([]), async () => ({ auth: { getUser: async () => ({ data: { user: null } }) } }));
  const response = await handler(new Request("http://analytics.test/api/v1/analytics?days=7"));
  assert.equal(response.status, 401);
});
