import assert from "node:assert/strict";
import test from "node:test";
import { createAlertsHandlers } from "./route.ts";

function fakeAdmin() {
  const state = { configs: [] };
  const admin = {
    from(table) {
      if (table === "trackmcp_api_keys") return { select() { return this; }, eq() { return this; }, maybeSingle: async () => ({ data: { workspace_id: "workspace-a", revoked_at: null }, error: null }) };
      if (table === "trackmcp_alert_destinations") return { select() { return this; }, eq() { return this; }, in() { return this; }, limit: async () => ({ data: [{ id: "destination-a", kind: "webhook", enabled: true, revoked_at: null }], error: null }) };
      const query = {
        filters: {}, action: null, values: null, selected: null,
        select(value) { this.selected = value; return this; },
        eq(field, value) { this.filters[field] = value; return this; },
        order() { return this; },
        limit(value) { this.limitValue = value; return this; },
        insert(value) { this.action = "insert"; this.values = value; return this; },
        update(value) { this.action = "update"; this.values = value; return this; },
        maybeSingle: async function () { return this.finish(true); },
        single: async function () { return this.finish(true); },
        then(resolve, reject) { return Promise.resolve(this.finish(false)).then(resolve, reject); },
        finish(single) {
          if (this.action === "insert") {
            const row = { id: `alert-${state.configs.length + 1}`, created_at: "2026-09-07T00:00:00Z", updated_at: "2026-09-07T00:00:00Z", ...this.values };
            state.configs.push(row);
            return { data: single ? row : [row], error: null };
          }
          const rows = state.configs.filter((row) => Object.entries(this.filters).every(([key, value]) => row[key] === value));
          return { data: single ? rows[0] || null : rows.slice(0, this.limitValue || 100), error: null };
        },
      };
      return query;
    },
  };
  return { admin, state };
}

test("alerts API requires authentication and scopes configuration to the authenticated workspace", async () => {
  const unauthenticated = createAlertsHandlers(() => fakeAdmin().admin, async () => ({ auth: { getUser: async () => ({ data: { user: null } }) } }));
  assert.equal((await unauthenticated.GET(new Request("http://test/api/v1/alerts"))).status, 401);
  const { admin, state } = fakeAdmin();
  const handlers = createAlertsHandlers(() => admin, async () => ({ auth: { getUser: async () => ({ data: { user: null } }) } }));
  const created = await handlers.POST(new Request("http://test/api/v1/alerts", { method: "POST", headers: { authorization: "Bearer key" }, body: JSON.stringify({ metric: "tool_error_rate_spike", tool_name: "search", environment: "production", destination_ids: ["destination-a"] }) }));
  assert.equal(created.status, 201);
  const body = await created.json();
  assert.equal(body.workspace_id, "workspace-a");
  assert.equal(body.policy_version, "p1-05-v1");
  const listed = await handlers.GET(new Request("http://test/api/v1/alerts?limit=100", { headers: { authorization: "Bearer key" } }));
  assert.equal(listed.status, 200);
  const listBody = await listed.json();
  assert.equal(listBody.data.length, 1);
  assert.equal(listBody.limit, 100);
  assert.equal(state.configs[0].workspace_id, "workspace-a");
});

test("alerts API rejects unbounded or unsupported configuration input", async () => {
  const { admin } = fakeAdmin();
  const handlers = createAlertsHandlers(() => admin, async () => ({ auth: { getUser: async () => ({ data: { user: null } }) } }));
  const invalidMetric = await handlers.POST(new Request("http://test/api/v1/alerts", { method: "POST", headers: { authorization: "Bearer key" }, body: JSON.stringify({ metric: "causal_model_failure" }) }));
  assert.equal(invalidMetric.status, 400);
  const oversized = await handlers.POST(new Request("http://test/api/v1/alerts", { method: "POST", headers: { authorization: "Bearer key" }, body: JSON.stringify({ metric: "tool_error_rate_spike", tool_name: "x".repeat(2049) }) }));
  assert.equal(oversized.status, 400);
  const oversizedBody = await handlers.POST(new Request("http://test/api/v1/alerts", { method: "POST", headers: { authorization: "Bearer key" }, body: "x".repeat(64 * 1024 + 1) }));
  assert.equal(oversizedBody.status, 413);
});
