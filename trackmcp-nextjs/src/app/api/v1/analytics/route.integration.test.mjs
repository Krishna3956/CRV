import assert from "node:assert/strict";
import test from "node:test";
import { createAnalyticsHandler } from "./handlers.ts";

function fakeAdmin(rows, refreshRows = []) {
  return {
    from(table) {
      if (table === "trackmcp_api_keys") {
        return { select() { return this; }, eq() { return this; }, maybeSingle: async () => ({ data: { workspace_id: "workspace-a", revoked_at: null }, error: null }) };
      }
      if (table === "trackmcp_refresh_jobs") {
        return { select() { return this; }, eq() { return this; }, order() { return this; }, limit: async () => ({ data: refreshRows, error: null }) };
      }
      const filters = {};
      const query = {
        select() { return this; },
        eq(field, value) { filters[field] = value; return this; },
        gte() { return this; },
        lt() { return this; },
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
    observation_source: "server",
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
    event({ event_id: "client-observation", observation_source: "client", context: "must not inflate aggregate", intent_source: "context_parameter", missing_capability: "hidden-client" }),
    event({ workspace_id: "workspace-b", event_id: "foreign", context: "foreign", intent_source: "context_parameter", missing_capability: "hidden" }),
  ]), async () => ({ auth: { getUser: async () => ({ data: { user: null } }) } }));
  const response = await handler(new Request("http://analytics.test/api/v1/analytics?days=7", { headers: { authorization: "Bearer key" } }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body.intent_sources, { context_parameter: 0, external_callback: 1, fallback: 1, missing: 1 });
  assert.deepEqual(body.missing_capabilities, [{ name: "bulk_export", reports: 1 }]);
  assert.equal(JSON.stringify(body).includes("hidden"), false);
  assert.equal(JSON.stringify(body).includes("must not inflate aggregate"), false);
});

test("analytics authentication remains required", async () => {
  const handler = createAnalyticsHandler(() => fakeAdmin([]), async () => ({ auth: { getUser: async () => ({ data: { user: null } }) } }));
  const response = await handler(new Request("http://analytics.test/api/v1/analytics?days=7"));
  assert.equal(response.status, 401);
});

test("analytics exposes conservative Founder OS outcome aggregates", async () => {
  const handler = createAnalyticsHandler(() => fakeAdmin([
    event({ event_id: "call-ok", event_type: "tool_call", tool_name: "lookup", success: true, account_key: "a".repeat(64), account_identity_source: "resolver" }),
    event({ event_id: "call-unknown", event_type: "tool_call", tool_name: "lookup" }),
    event({ event_id: "protocol-ok", event_type: "protocol", success: true }),
    event({ event_id: "workflow-ok", event_type: "workflow", workflow_id: "wf-1", payload: { name: "workflow", workflow_name: "sync", status: "completed" } }),
  ]));
  const response = await handler(new Request("http://analytics.test/api/v1/analytics?days=7", { headers: { authorization: "Bearer key" } }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.founder_os.facts.read_model_version, "1");
  assert.equal(body.founder_os.facts.outcomes.completed, 2);
  assert.equal(body.founder_os.facts.outcomes.unknown, 1);
  assert.equal(body.founder_os.facts.outcomes.not_observable, 1);
  assert.equal(body.founder_os.facts.error_rate, 0);
  assert.equal(body.founder_os.facts.workflow_completion_rate, 1);
  assert.deepEqual(body.founder_os.identity_coverage, {
    numerator: 1,
    denominator: 1,
    value: 1,
    source: "account_identity_source=resolver",
    limitation: "Event-weighted coverage; not a count of unique organizations or end users.",
  });
  assert.deepEqual(body.founder_os.identity_source_counts, { resolver: 1, unresolved: 0 });
  assert.deepEqual(body.account_summary.account_activity_bands, { one_event: 1, repeat: 0, high_activity: 0 });
  assert.equal(body.account_summary.active_account_keys, 1);
  assert.equal(body.account_summary.returning_account_keys, 0);
  assert.deepEqual(body.tool_adoption, { advertised: 0, observed: 1, breadth: null, unused: 0 });
  assert.deepEqual(body.deployment_summary, {
    observed_deployments: 0,
    linked_events: 0,
    limitation: "Count-only deployment linkage derived from telemetry; deployment names, IDs, and release health are not exposed here.",
  });
  assert.equal(body.data_trust.returned_event_count, 4);
  assert.equal(body.data_trust.truncated, false);
  assert.equal(body.data_trust.observed_through, "2026-09-06T00:00:00Z");
  assert.equal(body.refresh_status.status, "no_jobs");
  assert.equal(body.refresh_status.max_queue_lag_ms, 0);
});

test("analytics keeps missing client identity as an explicit Unknown client bucket", async () => {
  const handler = createAnalyticsHandler(() => fakeAdmin([
    event({ event_id: "known-client", event_type: "tool_call", tool_name: "lookup", client_name: "Claude" }),
    event({ event_id: "unknown-client", event_type: "tool_call", tool_name: "lookup", client_name: null }),
  ]));
  const response = await handler(new Request("http://analytics.test/api/v1/analytics?days=7", { headers: { authorization: "Bearer key" } }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body.clients.map((client) => [client.name, client.calls]), [["Claude", 1], ["Unknown client", 1]]);
});

test("analytics exposes unresolved explicit journeys without crashing on unnamed lifecycle rows", async () => {
  const handler = createAnalyticsHandler(() => fakeAdmin([
    event({ event_id: "journey-start", event_type: "workflow", workflow_id: "wf-1", payload: { name: "workflow", workflow_name: "checkout", status: "started" } }),
    event({ event_id: "journey-start-2", event_type: "workflow", workflow_id: "wf-4", payload: { name: "workflow", workflow_name: "checkout", status: "started" } }),
    event({ event_id: "unnamed-start", event_type: "workflow", workflow_id: "wf-2", payload: { name: "workflow", status: "started" } }),
    event({ event_id: "journey-failed", event_type: "workflow", workflow_id: "wf-3", payload: { name: "workflow", workflow_name: "checkout", status: "failed" } }),
  ]));
  const response = await handler(new Request("http://analytics.test/api/v1/analytics?days=7", { headers: { authorization: "Bearer key" } }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body.outcomes, [{ name: "checkout", started: 2, completed: 0, failed: 1, unresolved: 1 }]);
});

test("tool aggregation matches an independent reference reducer", async () => {
  const rows = [
    event({ event_id: "lookup-success", event_type: "tool_call", tool_name: "lookup", success: true, duration_ms: 100 }),
    event({ event_id: "lookup-failure", event_type: "tool_call", tool_name: "lookup", success: false, is_error: true, duration_ms: 300 }),
    event({ event_id: "write-success", event_type: "tool_call", tool_name: "write", success: true, duration_ms: 200 }),
    event({ event_id: "catalog", event_type: "catalog", payload: { name: "tools_discovered", tools: [{ name: "lookup" }, { name: "write" }, { name: "unused" }] } }),
  ];
  const reference = new Map();
  for (const row of rows.filter((item) => item.event_type === "tool_call")) {
    const current = reference.get(row.tool_name) || { calls: 0, errors: 0, durations: [] };
    current.calls += 1;
    if (row.is_error === true || row.success === false) current.errors += 1;
    current.durations.push(row.duration_ms);
    reference.set(row.tool_name, current);
  }
  const handler = createAnalyticsHandler(() => fakeAdmin(rows));
  const response = await handler(new Request("http://analytics.test/api/v1/analytics?days=7", { headers: { authorization: "Bearer key" } }));
  assert.equal(response.status, 200);
  const body = await response.json();
  const actual = Object.fromEntries(body.tools.map((tool) => [tool.name, { calls: tool.calls, errors: tool.errors, error_rate: tool.error_rate, avg_ms: tool.avg_ms }]));
  const expected = Object.fromEntries([...reference.entries()].map(([name, value]) => [name, { calls: value.calls, errors: value.errors, error_rate: value.errors / value.calls, avg_ms: Math.round(value.durations.reduce((sum, duration) => sum + duration, 0) / value.durations.length) }]));
  assert.deepEqual(actual, expected);
  assert.deepEqual(body.unused_tools, ["unused"]);
  assert.deepEqual(body.tool_adoption, { advertised: 3, observed: 2, breadth: 2 / 3, unused: 1 });
});

test("analytics marks queued and failed refresh work as degraded instead of available", async () => {
  const handler = createAnalyticsHandler(() => fakeAdmin([], [
    { workspace_id: "workspace-a", state: "queued", attempt_count: 0, created_at: "2026-09-05T00:00:00Z", updated_at: "2026-09-05T00:00:00Z" },
    { workspace_id: "workspace-a", state: "failed", attempt_count: 3, created_at: "2026-09-05T00:00:00Z", updated_at: "2026-09-05T00:00:00Z" },
  ]));
  const response = await handler(new Request("http://analytics.test/api/v1/analytics?days=7", { headers: { authorization: "Bearer key" } }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.refresh_status.status, "degraded");
  assert.equal(body.refresh_status.queued, 1);
  assert.equal(body.refresh_status.failed, 1);
  assert.ok(body.refresh_status.max_queue_lag_ms > 0);
});

test("analytics exposes only bounded hashed entity counts for resources and prompts", async () => {
  const hashA = "a".repeat(64);
  const hashB = "b".repeat(64);
  const handler = createAnalyticsHandler(() => fakeAdmin([
    event({ event_id: "resource-catalog", event_type: "catalog", catalog_kind: "resources", catalog_item_uri_hashes: [hashA, hashB, hashA] }),
    event({ event_id: "prompt-catalog", event_type: "catalog", catalog_kind: "prompts", catalog_item_name_hashes: [hashA, hashA] }),
    event({ event_id: "resource-call", event_type: "protocol", mcp_method: "resources/read" }),
    event({ event_id: "prompt-call", event_type: "protocol", mcp_method: "prompts/get" }),
  ]));
  const response = await handler(new Request("http://analytics.test/api/v1/analytics?days=7", { headers: { authorization: "Bearer key" } }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body.interaction_surfaces.resources, { events: 1, methods: ["resources/read"], entity_count: 2, entity_identity: "sha256_hash_count", entity_analytics: { status: "no_rows", read_events: 0, successful_reads: 0, failed_reads: 0, input_required_reads: 0 } });
  assert.deepEqual(body.interaction_surfaces.prompts, { events: 1, methods: ["prompts/get"], entity_count: 1, entity_identity: "sha256_hash_count", entity_analytics: { status: "no_rows", read_events: 0, successful_reads: 0, failed_reads: 0, input_required_reads: 0 } });
  assert.equal(JSON.stringify(body).includes(hashA), false);
});

test("analytics exposes bounded protocol lifecycle signals without treating them as outcomes", async () => {
  const handler = createAnalyticsHandler(() => fakeAdmin([
    event({ event_id: "signal-progress", event_type: "protocol", mcp_method: "notifications/progress" }),
    event({ event_id: "signal-change", event_type: "protocol", mcp_method: "notifications/tools/list_changed" }),
    event({ event_id: "signal-subscribe", event_type: "protocol", mcp_method: "resources/subscribe" }),
    event({ event_id: "signal-unsubscribe", event_type: "protocol", mcp_method: "resources/unsubscribe" }),
  ]));
  const response = await handler(new Request("http://analytics.test/api/v1/analytics?days=7", { headers: { authorization: "Bearer key" } }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body.protocol_signals, { notification: 0, progress: 1, catalog_changed: 1, subscription_started: 1, subscription_stopped: 1, observed_events: 4 });
  assert.equal(body.founder_os.facts.outcomes.not_observable, 4);
});

test("analytics insights carry bounded action context only when evidence supports it", async () => {
  const rows = Array.from({ length: 10 }, (_, index) => event({
    event_id: `failed-${index}`,
    event_type: "tool_call",
    tool_name: "unstable_tool",
    success: index < 2,
    is_error: index >= 2,
  }));
  const handler = createAnalyticsHandler(() => fakeAdmin(rows));
  const response = await handler(new Request("http://analytics.test/api/v1/analytics?days=7", { headers: { authorization: "Bearer key" } }));
  assert.equal(response.status, 200);
  const body = await response.json();
  const insight = body.insights.find((item) => item.title.includes("unstable_tool"));
  assert.equal(insight.affected_volume, 8);
  assert.equal(insight.confidence, "high");
  assert.match(insight.suggested_action, /error classes/);
  assert.equal(JSON.stringify(insight).includes("failed-"), false);
});
