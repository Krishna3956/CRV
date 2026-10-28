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
        not() { return this; },
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
    event({ event_id: "completion-request", event_type: "protocol", mcp_method: "completion/complete", interaction_id: "completion-1", intent_source: "context_parameter", payload: { _trackmcp: { observation_kind: "protocol_request", protocol_family: "completion" } } }),
    event({ event_id: "completion-response", event_type: "protocol", mcp_method: "completion/complete", interaction_id: "completion-1", intent_source: "context_parameter", payload: { _trackmcp: { observation_kind: "protocol_response", protocol_family: "completion", completion_value_count: 0, completion_total: 0, completion_has_more: true } } }),
    event({ event_id: "client-observation", observation_source: "client", context: "must not inflate aggregate", intent_source: "context_parameter", missing_capability: "hidden-client" }),
    event({ workspace_id: "workspace-b", event_id: "foreign", context: "foreign", intent_source: "context_parameter", missing_capability: "hidden" }),
  ]), async () => ({ auth: { getUser: async () => ({ data: { user: null } }) } }));
  const response = await handler(new Request("http://analytics.test/api/v1/analytics?days=7", { headers: { authorization: "Bearer key" } }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body.intent_sources, { context_parameter: 2, external_callback: 1, fallback: 1, missing: 1 });
  assert.deepEqual(body.missing_capabilities, [{ name: "bulk_export", reports: 1 }]);
  assert.deepEqual(body.completion_activity, { requests: 1, matched_requests: 1, unmatched_requests: 0, capability_advertised: null, responses_with_metadata: 1, with_suggestions: 0, empty_suggestions: 1, partial: 1, limitation: "Suggestion values, prompt/resource references, and argument contents are never returned. Older events without bounded completion metadata remain in protocol-family outcomes but are not classified as empty or partial." });
  assert.deepEqual(body.protocol_capability_gaps, []);
  assert.equal(JSON.stringify(body).includes("hidden"), false);
  assert.equal(JSON.stringify(body).includes("must not inflate aggregate"), false);
});

test("analytics authentication remains required", async () => {
  const handler = createAnalyticsHandler(() => fakeAdmin([]), async () => ({ auth: { getUser: async () => ({ data: { user: null } }) } }));
  const response = await handler(new Request("http://analytics.test/api/v1/analytics?days=7"));
  assert.equal(response.status, 401);
});

test("analytics reuses a short-lived workspace projection for repeated dashboard routes", async () => {
  const rows = [event({ event_id: "cached-first" })];
  const admin = fakeAdmin(rows);
  const handler = createAnalyticsHandler(() => admin);
  const first = await handler(new Request("http://analytics.test/api/v1/analytics?days=7", { headers: { authorization: "Bearer key" } }));
  assert.equal(first.status, 200);
  assert.equal((await first.json()).total_events, 1);

  rows.push(event({ event_id: "should-not-appear-until-cache-expires" }));
  const second = await handler(new Request("http://analytics.test/api/v1/analytics?days=7", { headers: { authorization: "Bearer key" } }));
  assert.equal(second.status, 200);
  assert.equal((await second.json()).total_events, 1);
});

test("analytics accepts a bounded inclusive custom date range", async () => {
  const handler = createAnalyticsHandler(() => fakeAdmin([event({ event_id: "custom-range" })]));
  const response = await handler(new Request("http://analytics.test/api/v1/analytics?from=2026-09-01&to=2026-09-07", { headers: { authorization: "Bearer key" } }));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).range_days, 7);
});

test("analytics rejects custom ranges longer than the bounded scan window", async () => {
  const handler = createAnalyticsHandler(() => fakeAdmin([]));
  const response = await handler(new Request("http://analytics.test/api/v1/analytics?from=2026-01-01&to=2026-04-01", { headers: { authorization: "Bearer key" } }));
  assert.equal(response.status, 400);
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
  assert.deepEqual(body.refresh_status.worker_health.map((finding) => finding.state), ["insufficient_data", "insufficient_data", "insufficient_data", "insufficient_data"]);
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

test("analytics exposes the complete Who's using it vertical-slice read model", async () => {
  const now = Date.now();
  const iso = (offsetDays) => new Date(now - offsetDays * 86400000).toISOString();
  const accountA = "a".repeat(64);
  const accountB = "b".repeat(64);
  const handler = createAnalyticsHandler(() => fakeAdmin([
    event({ event_id: "old-a", event_type: "tool_call", tool_name: "lookup", account_key: accountA, account_identity_source: "resolver", client_name: "Claude", started_at: iso(14) }),
    event({ event_id: "current-a", event_type: "tool_call", tool_name: "lookup", account_key: accountA, account_identity_source: "resolver", client_name: "Claude", started_at: iso(2) }),
    event({ event_id: "current-b", event_type: "tool_call", tool_name: "lookup", account_key: accountB, account_identity_source: "resolver", client_name: null, started_at: iso(1) }),
  ]));
  const response = await handler(new Request("http://analytics.test/api/v1/analytics?days=7", { headers: { authorization: "Bearer key" } }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.who_is_using_it.active_accounts, 2);
  assert.equal(body.who_is_using_it.new_accounts, 1);
  assert.equal(body.who_is_using_it.returning_accounts, 1);
  assert.equal(body.who_is_using_it.classification_status, "available");
  assert.deepEqual(body.who_is_using_it.client_breakdown.map((item) => item.name), ["Claude", "Unknown client"]);
  // The fixture query intentionally does not emulate Supabase's time filter;
  // the production projection is time-bounded before this reducer runs.
  assert.deepEqual(body.who_is_using_it.top_accounts.map((item) => item.activity_count), [2, 1]);
  assert.ok(body.who_is_using_it.growth.every((item) => new Date(`${item.period_start}T00:00:00Z`).getUTCDay() === 1));
  assert.equal(JSON.stringify(body).includes(accountA), false);
  assert.equal(JSON.stringify(body).includes(accountB), false);
});

test("capability drill-down keeps account identifiers private and sorts reliability by risk", async () => {
  const account = "c".repeat(64);
  const handler = createAnalyticsHandler(() => fakeAdmin([
    event({ event_id: "healthy", event_type: "tool_call", tool_name: "healthy", account_key: account, account_identity_source: "resolver", success: true }),
    event({ event_id: "broken", event_type: "tool_call", tool_name: "broken", account_key: account, account_identity_source: "resolver", success: false, is_error: true }),
  ]));
  const response = await handler(new Request("http://analytics.test/api/v1/analytics?days=7", { headers: { authorization: "Bearer key" } }));
  const body = await response.json();
  assert.equal(body.capability_activity.reliability[0].tool_name, "broken");
  assert.equal(body.capability_activity.tool_details.find((item) => item.tool_name === "broken").top_accounts[0].calls, 1);
  assert.equal(JSON.stringify(body.capability_activity.tool_details).includes(account), false);
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
  assert.equal(body.capability_activity.total_calls, 3);
  assert.equal(body.capability_activity.overall_error_rate, 1 / 3);
  assert.equal(body.capability_activity.adoption_distribution.every((item) => item.accounts === 0), true);
  assert.deepEqual(body.capability_activity.reliability[0], { tool_name: "lookup", calls: 2, error_rate: 0.5, input_required_rate: 0, p95_ms: 300 });
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
  assert.equal(body.refresh_status.worker_health.length, 4);
  assert.equal(body.refresh_status.worker_health.find((finding) => finding.metric === "backlog").value, 1);
  assert.equal(body.refresh_status.worker_health.find((finding) => finding.metric === "lag").unit, "minutes");
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

test("analytics exposes the Resources and Prompts vertical-slice read model", async () => {
  const handler = createAnalyticsHandler(() => fakeAdmin([
    event({ event_id: "resource-read", event_type: "protocol", mcp_method: "resources/read", success: true }),
    event({ event_id: "prompt-complete", event_type: "protocol", mcp_method: "prompts/get", result_type: "complete", success: true }),
    event({ event_id: "prompt-input", event_type: "protocol", mcp_method: "prompts/get", result_type: "input_required" }),
  ]));
  const response = await handler(new Request("http://analytics.test/api/v1/analytics?days=7", { headers: { authorization: "Bearer key" } }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.resource_prompt_activity.resource_reads, 1);
  assert.equal(body.resource_prompt_activity.prompt_calls, 2);
  assert.equal(body.resource_prompt_activity.prompt_completion_rate, 0.5);
  assert.equal(body.resource_prompt_activity.prompt_stall_rate, 0.5);
  assert.equal(body.resource_prompt_activity.prompt_error_rate, 0);
  assert.deepEqual(body.resource_prompt_activity.resource_breakdown[0], { name: "resources/read", calls: 1, share: 1, completion_rate: 0, stall_rate: 0, error_rate: 0, unknown_rate: 1 });
  assert.deepEqual(body.resource_prompt_activity.outcomes[0], { kind: "resource", interactions: 1, complete: 0, stalled: 0, errored: 0, unknown: 1, linked_retry_count: 0 });
  assert.equal(body.resource_prompt_activity.prompt_breakdown[0].name, "prompts/get");
  assert.equal(body.resource_prompt_activity.prompt_breakdown[0].completion_rate, 0.5);
});

test("Resources and Prompts keeps explicit outcomes separate and collapses only linked retries", async () => {
  const handler = createAnalyticsHandler(() => fakeAdmin([
    event({ event_id: "resource-needs-input", event_type: "protocol", mcp_method: "resources/read", interaction_id: "resource-1", result_type: "input_required", success: true }),
    event({ event_id: "resource-complete-retry", event_type: "protocol", mcp_method: "resources/read", interaction_id: "resource-1", retry_number: 1, result_type: "complete", success: true }),
    event({ event_id: "resource-error", event_type: "protocol", mcp_method: "resources/read", success: false, is_error: true }),
    event({ event_id: "resource-list", event_type: "protocol", mcp_method: "resources/list", success: true }),
    event({ event_id: "prompt-input", event_type: "protocol", mcp_method: "prompts/get", result_type: "input_required", success: true }),
    event({ event_id: "prompt-error", event_type: "protocol", mcp_method: "prompts/get", success: false, is_error: true }),
    event({ event_id: "prompt-list", event_type: "protocol", mcp_method: "prompts/list", success: true }),
  ]));
  const response = await handler(new Request("http://analytics.test/api/v1/analytics?days=7", { headers: { authorization: "Bearer key" } }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.resource_prompt_activity.resource_reads, 2);
  assert.equal(body.resource_prompt_activity.resource_observations, 3);
  assert.equal(body.resource_prompt_activity.prompt_calls, 2);
  assert.equal(body.resource_prompt_activity.prompt_observations, 2);
  assert.deepEqual(body.resource_prompt_activity.outcomes, [
    { kind: "resource", interactions: 2, complete: 1, stalled: 0, errored: 1, unknown: 0, linked_retry_count: 1 },
    { kind: "prompt", interactions: 2, complete: 0, stalled: 1, errored: 1, unknown: 0, linked_retry_count: 0 },
  ]);
  assert.equal(body.resource_prompt_activity.resource_completion_rate, 0.5);
  assert.equal(body.resource_prompt_activity.prompt_completion_rate, 0);
  assert.equal(body.resource_prompt_activity.prompt_stall_rate, 0.5);
  assert.equal(body.resource_prompt_activity.prompt_error_rate, 0.5);
  assert.equal(body.resource_prompt_activity.trend.every((item) => item.name === "resources/read" || item.name === "prompts/get"), true);
});

test("analytics exposes bounded Journey path and stall evidence", async () => {
  const handler = createAnalyticsHandler(() => fakeAdmin([
    event({ event_id: "journey-a", event_type: "tool_call", tool_name: "search", interaction_id: "i-1", success: true }),
    event({ event_id: "journey-b", event_type: "tool_call", tool_name: "details", interaction_id: "i-1", result_type: "input_required" }),
    event({ event_id: "journey-c", event_type: "tool_call", tool_name: "details", interaction_id: "i-1", retry_number: 1, success: true }),
    event({ event_id: "journey-d", event_type: "tool_call", tool_name: "search", interaction_id: "i-2", success: true }),
  ]));
  const response = await handler(new Request("http://analytics.test/api/v1/analytics?days=7", { headers: { authorization: "Bearer key" } }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.journey_activity.interaction_count, 2);
  assert.equal(body.journey_activity.typical_journey_length, 1);
  assert.equal(body.journey_activity.stalled_interactions, 1);
  assert.equal(body.journey_activity.resumed_after_stall, 1);
  assert.deepEqual(body.journey_activity.common_paths[0].path, ["search", "details", "details"]);
  assert.equal(body.journey_activity.drop_off[0].terminal_evidence, "unknown");
});

test("journey terminal evidence comes from the latest event and is server-scoped", async () => {
  const handler = createAnalyticsHandler(() => fakeAdmin([
    event({ event_id: "server-a-error", event_type: "tool_call", tool_name: "search", interaction_id: "same-id", server_id: "server-a", success: false, is_error: true }),
    event({ event_id: "server-a-retry", event_type: "tool_call", tool_name: "search", interaction_id: "same-id", server_id: "server-a", retry_number: 1, success: true }),
    event({ event_id: "server-b-input", event_type: "tool_call", tool_name: "search", interaction_id: "same-id", server_id: "server-b", result_type: "input_required" }),
  ]));
  const response = await handler(new Request("http://analytics.test/api/v1/analytics?days=7", { headers: { authorization: "Bearer key" } }));
  const body = await response.json();
  assert.equal(body.journey_activity.interaction_count, 2);
  assert.equal(body.journey_activity.resumed_after_stall, 0);
  assert.deepEqual(body.journey_activity.drop_off.map((path) => path.terminal_evidence).sort(), ["input_required", "unknown"]);
  assert.equal(body.journey_activity.funnel[0].step, "search");
  assert.equal(body.journey_activity.funnel[0].reached, 1);
  assert.equal(body.journey_activity.stall_retry[0].status, "not_observed");
});

test("analytics keeps Did It Work outcomes explicit and uncertainty separate", async () => {
  const handler = createAnalyticsHandler(() => fakeAdmin([
    event({ event_id: "outcome-complete", event_type: "workflow", payload: { name: "workflow", workflow_name: "sync", status: "completed" } }),
    event({ event_id: "outcome-failed", event_type: "workflow", payload: { name: "workflow", workflow_name: "sync", status: "failed" } }),
    event({ event_id: "outcome-pending", event_type: "workflow", payload: { name: "workflow", workflow_name: "sync", status: "started" } }),
  ]));
  const response = await handler(new Request("http://analytics.test/api/v1/analytics?days=7", { headers: { authorization: "Bearer key" } }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.outcome_activity.completed, 1);
  assert.equal(body.outcome_activity.failed, 1);
  assert.ok(body.outcome_activity.pending >= 1);
  assert.equal(body.outcome_activity.completion_rate, 0.5);
  assert.equal(body.outcome_activity.error_rate, 0.5);
  assert.equal(body.outcome_activity.limitation.includes("never converted"), true);
});

test("analytics outcome activity keeps latest explicit task state separate from tool success", async () => {
  const handler = createAnalyticsHandler(() => fakeAdmin([
    event({ event_id: "task-expired", event_type: "protocol", task_id: "raw-task-handle", mcp_method: "tasks/get", payload: { status: "expired" }, success: true, started_at: "2026-09-06T00:00:00Z" }),
    event({ event_id: "task-complete", event_type: "protocol", task_id: "raw-task-handle", mcp_method: "tasks/get", payload: { status: "completed" }, success: true, started_at: "2026-09-06T00:05:00Z" }),
    event({ event_id: "tool-success", event_type: "tool_call", tool_name: "lookup", success: true }),
  ]));
  const response = await handler(new Request("http://analytics.test/api/v1/analytics?days=7", { headers: { authorization: "Bearer key" } }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body.outcome_activity.task_states, { working: 0, input_required: 0, completed: 1, failed: 0, cancelled: 0, expired: 0, unknown: 0 });
  assert.equal(body.outcome_activity.completed, 1);
  assert.equal(body.outcome_activity.failed, 0);
  assert.equal(JSON.stringify(body).includes("raw-task-handle"), false);
});

test("analytics exposes bounded What is broken signal evidence", async () => {
  const rows = Array.from({ length: 30 }, (_, index) => event({ event_id: `lookup-${index}`, event_type: "tool_call", tool_name: "lookup", is_error: index < 6, success: index >= 6 }));
  rows.push(...Array.from({ length: 30 }, (_, index) => event({ event_id: `slow-${index}`, event_type: "tool_call", tool_name: "slow", duration_ms: 900, success: true })));
  const handler = createAnalyticsHandler(() => fakeAdmin(rows));
  const response = await handler(new Request("http://analytics.test/api/v1/analytics?days=7", { headers: { authorization: "Bearer key" } }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.ok(body.issue_activity.actionable_signals >= 1);
  assert.ok(body.issue_activity.affected_volume >= 6);
  assert.equal(body.issue_activity.limitation.includes("not diagnoses"), true);
});

test("analytics exposes bounded protocol lifecycle signals without treating them as outcomes", async () => {
  const handler = createAnalyticsHandler(() => fakeAdmin([
    event({ event_id: "signal-progress", event_type: "protocol", mcp_method: "notifications/progress" }),
    event({ event_id: "signal-change", event_type: "protocol", mcp_method: "notifications/tools/list_changed" }),
    event({ event_id: "signal-resource-change", event_type: "protocol", mcp_method: "notifications/resources/updated" }),
    event({ event_id: "signal-subscribe", event_type: "protocol", mcp_method: "resources/subscribe" }),
    event({ event_id: "signal-unsubscribe", event_type: "protocol", mcp_method: "resources/unsubscribe" }),
    event({ event_id: "family-sampling", observation_source: "client", event_type: "protocol", mcp_method: "sampling/createMessage", result_type: "input_required", payload: { _trackmcp: { protocol_family: "sampling" } } }),
    event({ event_id: "family-elicitation", observation_source: "client", event_type: "protocol", mcp_method: "elicitation/create", result_type: "complete", payload: { _trackmcp: { protocol_family: "elicitation" } } }),
    event({ event_id: "family-tasks", observation_source: "client", event_type: "protocol", mcp_method: "tasks/get", payload: { _trackmcp: { protocol_family: "tasks" } } }),
    event({ event_id: "family-resources", observation_source: "client", event_type: "protocol", mcp_method: "resources/list", payload: { _trackmcp: { protocol_family: "resources" } } }),
    event({ event_id: "family-subscriptions", observation_source: "client", event_type: "protocol", mcp_method: "subscriptions/subscribe", payload: { _trackmcp: { protocol_family: "subscriptions" } } }),
    event({ event_id: "modern-capability-discovery", event_type: "session", payload: { _trackmcp: { protocol_family: "control_signal", capability_names: ["io.modelcontextprotocol/tasks"] } } }),
    event({ event_id: "modern-task-observation", event_type: "protocol", mcp_method: "tasks/get", payload: { _trackmcp: { protocol_family: "tasks" } } }),
    event({ event_id: "family-completion-method-only", observation_source: "server", event_type: "protocol", mcp_method: "completion/complete", result_type: "complete" }),
  ]));
  const response = await handler(new Request("http://analytics.test/api/v1/analytics?days=7", { headers: { authorization: "Bearer key" } }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body.protocol_signals, {
    notification: 0, progress: 1, cancelled: 0, catalog_changed: 1, resource_changed: 1,
    subscription_started: 1, subscription_stopped: 1, observed_events: 5,
    catalog_change_kinds: { tools: 1, resources: 0, resource_templates: 0, prompts: 0 },
    timeline: [{ date: "2026-09-06", notification: 0, progress: 1, cancelled: 0, catalog_changed: 1, resource_changed: 1, subscription_started: 1, subscription_stopped: 1, observed_events: 5 }],
  });
  assert.deepEqual(body.protocol_family_activity, [{ family: "notifications", observations: 3 }, { family: "resources", observations: 3 }, { family: "tasks", observations: 2 }, { family: "completion", observations: 1 }, { family: "control_signal", observations: 1 }, { family: "elicitation", observations: 1 }, { family: "sampling", observations: 1 }, { family: "subscriptions", observations: 1 }]);
  assert.deepEqual(body.protocol_family_outcomes, [{ family: "notifications", observations: 3, requests: 0, responses: 0, matched: 0, completed: 0, errors: 0, input_required: 0, unknown: 3, capability_advertised: false }, { family: "resources", observations: 3, requests: 0, responses: 0, matched: 0, completed: 0, errors: 0, input_required: 0, unknown: 3, capability_advertised: false }, { family: "tasks", observations: 2, requests: 0, responses: 0, matched: 0, completed: 0, errors: 0, input_required: 0, unknown: 2, capability_advertised: true }, { family: "completion", observations: 1, requests: 0, responses: 0, matched: 0, completed: 1, errors: 0, input_required: 0, unknown: 0, capability_advertised: false }, { family: "control_signal", observations: 1, requests: 0, responses: 0, matched: 0, completed: 0, errors: 0, input_required: 0, unknown: 1, capability_advertised: false }, { family: "elicitation", observations: 1, requests: 0, responses: 0, matched: 0, completed: 1, errors: 0, input_required: 0, unknown: 0, capability_advertised: false }, { family: "sampling", observations: 1, requests: 0, responses: 0, matched: 0, completed: 0, errors: 0, input_required: 1, unknown: 0, capability_advertised: false }, { family: "subscriptions", observations: 1, requests: 0, responses: 0, matched: 0, completed: 0, errors: 0, input_required: 0, unknown: 1, capability_advertised: false }]);
  assert.equal(body.protocol_family_outcome_source, "event_window");
  assert.equal(body.founder_os.facts.outcomes.not_observable, 6);
});

test("analytics prefers the bounded durable semantic-fact family projection when available", async () => {
  const durableFacts = [
    { semantic: { outcome: "completed" }, dimensions: { protocol_family: "completion", protocol_observation_kind: "protocol_request", interaction_id_hash: "612bffc01ad431f98bca56a51c5f65a99c3a87449e03b99a51039e58d62bbbc6" }, event_type: "protocol", observed_at: "2026-09-06T00:00:00Z" },
    { semantic: { outcome: "completed" }, dimensions: { protocol_family: "completion", protocol_observation_kind: "protocol_response", interaction_id_hash: "612bffc01ad431f98bca56a51c5f65a99c3a87449e03b99a51039e58d62bbbc6" }, event_type: "protocol", observed_at: "2026-09-06T00:00:00Z" },
    { semantic: { outcome: "pending" }, dimensions: { protocol_family: "sampling", protocol_observation_kind: "protocol_response", interaction_id_hash: "0338ac81cf24e13b1b0eb27e0bc977b1817b5b9ae3a73327a7d9ccafc9dfbaf8" }, event_type: "protocol", observed_at: "2026-09-06T00:00:00Z" },
  ];
  const base = fakeAdmin([]);
  const originalFrom = base.from.bind(base);
  base.from = (table) => table === "trackmcp_semantic_facts"
    ? { select() { return this; }, eq() { return this; }, gte() { return this; }, limit: async () => ({ data: durableFacts, error: null }) }
    : originalFrom(table);
  const response = await createAnalyticsHandler(() => base)(new Request("http://analytics.test/api/v1/analytics?days=7", { headers: { authorization: "Bearer key" } }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.protocol_family_outcome_source, "durable_facts");
  assert.deepEqual(body.protocol_family_outcomes, [
    { family: "completion", observations: 2, requests: 1, responses: 1, matched: 1, completed: 2, errors: 0, input_required: 0, unknown: 0, capability_advertised: null },
    { family: "sampling", observations: 1, requests: 0, responses: 1, matched: 0, completed: 0, errors: 0, input_required: 1, unknown: 0, capability_advertised: null },
  ]);
});

test("analytics matches durable MRTR evidence through request-state and retry linkage", async () => {
  const durableFacts = [
    { source_event_id: "mrtr-request-1", semantic: { outcome: "pending" }, dimensions: { protocol_family: "elicitation", protocol_observation_kind: "protocol_request" }, event_type: "protocol", observed_at: "2026-09-06T00:00:00Z", service: "demo", environment: "prod" },
    { source_event_id: "mrtr-response-1", semantic: { outcome: "completed" }, dimensions: { protocol_family: "elicitation", protocol_observation_kind: "protocol_response", retry_of_event_id: "mrtr-request-1" }, event_type: "protocol", observed_at: "2026-09-06T00:00:01Z", service: "demo", environment: "prod" },
    { source_event_id: "mrtr-request-2", semantic: { outcome: "pending" }, dimensions: { protocol_family: "elicitation", protocol_observation_kind: "protocol_request", request_state_hash: "a".repeat(64) }, event_type: "protocol", observed_at: "2026-09-06T00:00:02Z", service: "demo", environment: "prod" },
    { source_event_id: "mrtr-response-2", semantic: { outcome: "completed" }, dimensions: { protocol_family: "elicitation", protocol_observation_kind: "protocol_response", request_state_hash: "a".repeat(64) }, event_type: "protocol", observed_at: "2026-09-06T00:00:03Z", service: "demo", environment: "prod" },
  ];
  const base = fakeAdmin([]);
  const originalFrom = base.from.bind(base);
  base.from = (table) => table === "trackmcp_semantic_facts"
    ? { select() { return this; }, eq() { return this; }, gte() { return this; }, limit: async () => ({ data: durableFacts, error: null }) }
    : originalFrom(table);
  const response = await createAnalyticsHandler(() => base)(new Request("http://analytics.test/api/v1/analytics?days=7", { headers: { authorization: "Bearer key" } }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body.protocol_family_outcomes, [
    { family: "elicitation", observations: 4, requests: 2, responses: 2, matched: 2, completed: 2, errors: 0, input_required: 2, unknown: 0, capability_advertised: null },
  ]);
  assert.deepEqual(body.protocol_mrtr_linkage, {
    request_state_hashes: 1,
    interaction_hashes: 0,
    retry_links: 1,
    matched_pairs: 2,
    source: "durable_facts",
    limitation: "Counts are metadata-only evidence. Hashes and retry identifiers are never returned; a matched pair requires the same explicit interaction/request-state handle or an allowlisted retry link within the bounded workspace window.",
  });
});

test("analytics keeps MRTR lifecycle evidence separated across supported transports", async () => {
  const transports = ["stdio", "streamable_http", "sse", "custom"];
  const durableFacts = transports.flatMap((transport, index) => [
    { source_event_id: `${transport}-request`, semantic: { outcome: "pending" }, dimensions: { protocol_family: "elicitation", protocol_observation_kind: "protocol_request", transport, interaction_id_hash: String(index + 1).repeat(64) }, event_type: "protocol", observed_at: `2026-09-06T00:00:0${index}Z`, service: "demo", environment: "prod" },
    { source_event_id: `${transport}-response`, semantic: { outcome: "completed" }, dimensions: { protocol_family: "elicitation", protocol_observation_kind: "protocol_response", transport, interaction_id_hash: String(index + 1).repeat(64) }, event_type: "protocol", observed_at: `2026-09-06T00:00:1${index}Z`, service: "demo", environment: "prod" },
  ]);
  const base = fakeAdmin([]);
  const originalFrom = base.from.bind(base);
  base.from = (table) => table === "trackmcp_semantic_facts"
    ? { select() { return this; }, eq() { return this; }, gte() { return this; }, limit: async () => ({ data: durableFacts, error: null }) }
    : originalFrom(table);
  const response = await createAnalyticsHandler(() => base)(new Request("http://analytics.test/api/v1/analytics?days=7", { headers: { authorization: "Bearer key" } }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body.protocol_transport_outcomes, transports.slice().sort().map((transport) => ({ transport, observations: 2, requests: 1, responses: 1, matched: 1, completed: 1, errors: 0, input_required: 1, unknown: 0 })));
  assert.equal(body.protocol_mrtr_linkage.interaction_hashes, 4);
  assert.equal(body.protocol_mrtr_linkage.matched_pairs, 4);
});

test("analytics insights carry bounded action context only when evidence supports it", async () => {
  const rows = Array.from({ length: 30 }, (_, index) => event({
    event_id: `failed-${index}`,
    event_type: "tool_call",
    tool_name: "unstable_tool",
    success: index < 6,
    is_error: index >= 6,
  }));
  const handler = createAnalyticsHandler(() => fakeAdmin(rows));
  const response = await handler(new Request("http://analytics.test/api/v1/analytics?days=7", { headers: { authorization: "Bearer key" } }));
  assert.equal(response.status, 200);
  const body = await response.json();
  const insight = body.insights.find((item) => item.title.includes("unstable_tool"));
  assert.equal(insight.affected_volume, 24);
  assert.equal(insight.confidence, "high");
  assert.match(insight.suggested_action, /error classes/);
  assert.equal(JSON.stringify(insight).includes("failed-"), false);
});

test("analytics does not promote low-volume tool observations into broken-product signals", async () => {
  const handler = createAnalyticsHandler(() => fakeAdmin([
    event({ event_id: "one-off-error", event_type: "tool_call", tool_name: "rare_tool", is_error: true, success: false }),
    event({ event_id: "one-off-slow", event_type: "tool_call", tool_name: "rare_slow", duration_ms: 900, success: true }),
  ]));
  const response = await handler(new Request("http://analytics.test/api/v1/analytics?days=7", { headers: { authorization: "Bearer key" } }));
  const body = await response.json();
  assert.equal(body.insights.some((item) => item.title.includes("rare_")), false);
  assert.equal(body.issue_activity.actionable_signals, 0);
});
