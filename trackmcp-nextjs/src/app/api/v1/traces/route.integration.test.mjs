import assert from "node:assert/strict";
import test from "node:test";
import { createTraceHandler, MAX_TRACE_LIMIT } from "./route.ts";

const API_KEY = "tmcp_trace_integration_key";

function event(overrides = {}) {
  return {
    schema_version: "1",
    event_id: `event-${Math.random()}`,
    event_type: "tool_call",
    service: "trace-test",
    environment: "test",
    started_at: "2026-09-06T00:00:00Z",
    session_id: "session-a",
    session_id_source: "protocol",
    duration_ms: 20,
    success: true,
    ...overrides,
  };
}

function fakeAdmin(rows) {
  return {
    from(table) {
      if (table === "trackmcp_api_keys") {
        return {
          select() { return this; },
          eq() { return this; },
          maybeSingle: async () => ({ data: { workspace_id: "workspace-a", revoked_at: null }, error: null }),
        };
      }
      const filters = {};
      const query = {
        select() { return this; },
        eq(field, value) { filters[field] = value; return this; },
        order() { return this; },
        limit(value) {
            const scoped = rows.filter((row) => row.workspace_id === filters.workspace_id && (filters.session_id === undefined || row.session_id === filters.session_id) && (filters.correlation_handle === undefined || row.correlation_handle === filters.correlation_handle));
          return Promise.resolve({ data: scoped.slice(0, value), error: null });
        },
      };
      return query;
    },
  };
}

async function get(handler, query) {
  const response = await handler(new Request(`http://trace.test/api/v1/traces?${query}`, {
    headers: { authorization: `Bearer ${API_KEY}` },
  }));
  return { status: response.status, body: await response.json() };
}

test("trace route bounds results, preserves event order, and reports completion/correlation semantics", async () => {
  const rows = [
    event({ workspace_id: "workspace-a", event_id: "first", started_at: "2026-09-06T00:00:01Z" }),
    event({ workspace_id: "workspace-a", event_id: "second", started_at: "2026-09-06T00:00:02Z", session_id_source: "transport_generated" }),
    event({ workspace_id: "workspace-a", event_id: "third", started_at: "2026-09-06T00:00:03Z" }),
    event({ workspace_id: "workspace-b", event_id: "foreign", started_at: "2026-09-06T00:00:00Z" }),
  ];
  const response = await get(createTraceHandler(() => fakeAdmin(rows)), "session_id=session-a&limit=2");
  assert.equal(response.status, 200);
  assert.equal(response.body.event_count, 2);
  assert.equal(response.body.truncated, true);
  assert.deepEqual(response.body.events.map((row) => row.event_id), ["first", "second"]);
  assert.equal(response.body.correlation_quality, "mixed");
  assert.equal(response.body.completion_source, "session_heuristic");
  assert.equal(response.body.events.some((row) => row.event_id === "foreign"), false);
});

test("trace route exposes protocol, transport-generated, and missing quality labels", async () => {
  const handler = createTraceHandler(() => fakeAdmin([
    event({ workspace_id: "workspace-a", session_id: "protocol", session_id_source: "protocol" }),
    event({ workspace_id: "workspace-a", session_id: "fallback", session_id_source: "transport_generated" }),
    event({ workspace_id: "workspace-a", session_id: "missing", session_id_source: "missing" }),
  ]));
  assert.equal((await get(handler, "session_id=protocol")).body.correlation_quality, "session_id");
  assert.equal((await get(handler, "session_id=fallback")).body.correlation_quality, "transport_generated");
  assert.equal((await get(handler, "session_id=missing")).body.correlation_quality, "missing");
});

test("trace route rejects invalid limits and keeps workspace scoping on guessed session IDs", async () => {
  const handler = createTraceHandler(() => fakeAdmin([event({ workspace_id: "workspace-b", session_id: "secret-session", event_id: "foreign" })]));
  assert.equal((await get(handler, `session_id=secret-session&limit=${MAX_TRACE_LIMIT + 1}`)).status, 400);
  const isolated = await get(handler, "session_id=secret-session");
  assert.equal(isolated.status, 200);
  assert.deepEqual(isolated.body.events, []);
  assert.equal(isolated.body.event_count, 0);
  assert.equal(isolated.body.correlation_quality, "missing");
});

test("trace route can query a bounded handle without overloading session_id", async () => {
  const handler = createTraceHandler(() => fakeAdmin([
    event({ workspace_id: "workspace-a", event_id: "handle-event", session_id: null, correlation_handle: "job_anon_1", correlation_handle_source: "external" }),
    event({ workspace_id: "workspace-b", event_id: "foreign-handle", session_id: null, correlation_handle: "job_anon_1", correlation_handle_source: "external" }),
  ]));
  const response = await get(handler, "correlation_handle=job_anon_1");
  assert.equal(response.status, 200);
  assert.equal(response.body.session_id, null);
  assert.equal(response.body.correlation_handle, "job_anon_1");
  assert.equal(response.body.correlation_handle_source, "external");
  assert.deepEqual(response.body.events.map((row) => row.event_id), ["handle-event"]);
});
