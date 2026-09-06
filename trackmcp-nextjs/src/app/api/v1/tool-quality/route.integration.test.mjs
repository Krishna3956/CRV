import assert from "node:assert/strict";
import test from "node:test";
import { createToolQualityHandler } from "./route.ts";

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
        gte(field, value) { filters[field] = value; return this; },
        order() { return this; },
        limit(limit) { return Promise.resolve({ data: rows.filter((row) => row.workspace_id === filters.workspace_id).slice(0, limit), error: null }); },
      };
      return query;
    },
  };
}

function call(index, workspaceId = "workspace-a") {
  return {
    workspace_id: workspaceId,
    event_type: "tool_call",
    service: "quality-test",
    environment: "test",
    tool_name: "search",
    session_id: `session-${index}`,
    client_name: "Client A",
    intent_source: "missing",
    started_at: `2026-09-06T00:${String(index % 60).padStart(2, "0")}:00.000Z`,
    success: true,
    is_error: false,
    retry_number: 0,
    payload_policy: "redacted",
    payload: { result: { item: "value" } },
  };
}

test("tool-quality is authenticated, workspace scoped, bounded, and returns the contract fields", async () => {
  const handler = createToolQualityHandler(() => fakeAdmin([
    ...Array.from({ length: 30 }, (_, index) => call(index)),
    call(31, "workspace-b"),
  ]), async () => ({ auth: { getUser: async () => ({ data: { user: null } }) } }));
  const response = await handler(new Request("http://analytics.test/api/v1/tool-quality?days=7", { headers: { authorization: "Bearer key" } }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.range_days, 7);
  assert.equal(body.source_event_count, 30);
  assert.equal(body.truncated, false);
  assert.ok(Array.isArray(body.tools));
  assert.ok(Object.hasOwn(body.tools[0], "completion_association"));
  assert.equal(body.tools[0].metrics.tool_call_share, 1);
});

test("tool-quality rejects invalid range values and unauthenticated requests", async () => {
  const handler = createToolQualityHandler(() => fakeAdmin([]), async () => ({ auth: { getUser: async () => ({ data: { user: null } }) } }));
  assert.equal((await handler(new Request("http://analytics.test/api/v1/tool-quality?days=91", { headers: { authorization: "Bearer key" } }))).status, 400);
  assert.equal((await handler(new Request("http://analytics.test/api/v1/tool-quality?days=abc", { headers: { authorization: "Bearer key" } }))).status, 400);
  assert.equal((await handler(new Request("http://analytics.test/api/v1/tool-quality"))).status, 401);
});

test("tool-quality marks the bounded source scan when more than 10,000 rows are available", async () => {
  const handler = createToolQualityHandler(() => fakeAdmin(Array.from({ length: 10001 }, (_, index) => call(index))), async () => ({ auth: { getUser: async () => ({ data: { user: null } }) } }));
  const response = await handler(new Request("http://analytics.test/api/v1/tool-quality", { headers: { authorization: "Bearer key" } }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.source_event_count, 10000);
  assert.equal(body.truncated, true);
});
