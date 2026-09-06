import assert from "node:assert/strict";
import test from "node:test";
import {
  analyzeToolQuality,
  TOOL_QUALITY_LOW_COMPLETION_THRESHOLD,
  TOOL_QUALITY_MIN_TOOL_CALLS,
  TOOL_QUALITY_MIN_WORKFLOW_TERMINALS,
} from "./tool-quality.ts";
import type { ToolQualityEvent } from "./tool-quality.ts";

function call(overrides: Record<string, unknown> = {}): ToolQualityEvent {
  return {
    event_type: "tool_call",
    observation_source: "server",
    service: "quality-test",
    environment: "test",
    tool_name: "search",
    started_at: "2026-09-06T00:00:00.000Z",
    session_id: "session-1",
    client_name: "Client A",
    intent_source: "context_parameter",
    success: true,
    is_error: false,
    retry_number: 0,
    payload_policy: "redacted",
    payload: { result: { items: ["one"] } },
    ...overrides,
  };
}

function catalog(at: string, descriptionHash: string, schemaHash: string): ToolQualityEvent {
  return {
    event_type: "catalog",
    observation_source: "server",
    service: "quality-test",
    environment: "test",
    started_at: at,
    payload: { name: "tools_discovered", tools: [{ name: "search", tool_description_hash: descriptionHash, schema_hash: schemaHash }] },
  };
}

function workflowSet(completedCount: number) {
  const events: ToolQualityEvent[] = [];
  for (let index = 0; index < TOOL_QUALITY_MIN_WORKFLOW_TERMINALS; index += 1) {
    const workflowId = `workflow-${index}`;
    const startedAt = `2026-09-06T01:${String(index).padStart(2, "0")}:00.000Z`;
    events.push({ event_type: "workflow", observation_source: "server", workflow_id: workflowId, started_at: startedAt, payload: { name: "workflow", workflow_name: "job", status: "started" } });
    events.push(call({ workflow_id: workflowId, session_id: `workflow-session-${index}`, started_at: startedAt, tool_name: "search" }));
    events.push({ event_type: "workflow", observation_source: "server", workflow_id: workflowId, started_at: `2026-09-06T02:${String(index).padStart(2, "0")}:00.000Z`, payload: { name: "workflow", workflow_name: "job", status: index < completedCount ? "completed" : "failed" } });
    events.push(call({ workflow_id: workflowId, session_id: `workflow-session-${index}`, started_at: `2026-09-06T00:${String(index).padStart(2, "0")}:00.000Z`, tool_name: "search" }));
  }
  events.push({ event_type: "workflow", observation_source: "server", workflow_id: "workflow-unknown", started_at: "2026-09-06T03:00:00.000Z", payload: { name: "workflow", workflow_name: "job", status: "started" } });
  events.push(call({ workflow_id: "workflow-unknown", session_id: "workflow-session-unknown", started_at: "2026-09-06T03:01:00.000Z", tool_name: "search" }));
  events.push({ event_type: "workflow", observation_source: "server", workflow_id: "workflow-unknown", started_at: "2026-09-06T03:02:00.000Z", payload: { name: "workflow", workflow_name: "job", status: "unknown" } });
  return events;
}

test("uses observable denominators and excludes metadata-only or truncated empty results", () => {
  const events = Array.from({ length: TOOL_QUALITY_MIN_TOOL_CALLS }, (_, index) => call({
    started_at: `2026-09-06T00:${String(index).padStart(2, "0")}:00.000Z`,
    payload: index < 10 ? { result: {} } : index < 20 ? { result: { item: "value" } } : { result: {}, truncated: true },
    payload_policy: index >= 20 && index < 25 ? "metadata" : "redacted",
    success: index === 29 ? false : true,
  }));
  const tool = analyzeToolQuality(events, { rangeDays: 30 }).tools[0];
  assert.equal(tool.observed.inspectable_successful_result_count, 20);
  assert.equal(tool.observed.empty_result_count, 10);
  assert.equal(tool.metrics.observable_empty_result_rate, 0.5);
  assert.equal(tool.metrics.error_rate, 1 / 30);
  assert.equal(tool.metrics.tool_call_share, 1);
});

test("computes repeat calls only within a session or correlation group and excludes retries", () => {
  const events = Array.from({ length: TOOL_QUALITY_MIN_TOOL_CALLS }, (_, index) => call({
    started_at: `2026-09-06T03:${String(index).padStart(2, "0")}:00.000Z`,
    session_id: index < 3 ? "repeat-session" : index < 5 ? null : `session-${index}`,
    correlation_handle: index >= 3 && index < 5 ? "repeat-group" : null,
    retry_number: index === 2 ? 1 : 0,
  }));
  const tool = analyzeToolQuality(events, { rangeDays: 30 }).tools[0];
  assert.equal(tool.observed.non_retry_call_count, 29);
  assert.equal(tool.observed.observed_repeat_call_count, 4);
  assert.equal(tool.metrics.observed_repeat_call_rate, 4 / 29);
});

test("finds same-tool repeats separated by another tool in the same group", () => {
  const events = [
    call({ started_at: "2026-09-06T07:00:00.000Z", session_id: "interleaved-session" }),
    call({ started_at: "2026-09-06T07:01:00.000Z", session_id: "interleaved-session", tool_name: "another_tool" }),
    call({ started_at: "2026-09-06T07:02:00.000Z", session_id: "interleaved-session" }),
    ...Array.from({ length: 28 }, (_, index) => call({ started_at: `2026-09-06T08:${String(index).padStart(2, "0")}:00.000Z`, session_id: `isolated-${index}` })),
  ];
  const tool = analyzeToolQuality(events, { rangeDays: 30 }).tools.find((entry) => entry.name === "search")!;
  assert.equal(tool.observed.call_count, 30);
  assert.equal(tool.observed.observed_repeat_call_count, 2);
  assert.equal(tool.metrics.observed_repeat_call_rate, 2 / 30);
});

test("does not fabricate repeat-call quality when grouping is missing", () => {
  const result = analyzeToolQuality(Array.from({ length: TOOL_QUALITY_MIN_TOOL_CALLS }, (_, index) => call({
    started_at: `2026-09-06T09:${String(index).padStart(2, "0")}:00.000Z`,
    session_id: null,
    correlation_handle: null,
  })), { rangeDays: 30 });
  const tool = result.tools[0];
  assert.equal(tool.metrics.observed_repeat_call_rate, null);
  assert.ok(tool.insufficient_data.includes("missing_grouping"));
});

test("client observations do not inflate server-only Tool Quality metrics", () => {
  const serverCalls = Array.from({ length: TOOL_QUALITY_MIN_TOOL_CALLS }, (_, index) => call({
    started_at: `2026-09-06T10:${String(index).padStart(2, "0")}:00.000Z`,
  }));
  const clientCalls = Array.from({ length: TOOL_QUALITY_MIN_TOOL_CALLS }, (_, index) => call({
    observation_source: "client",
    started_at: `2026-09-06T11:${String(index).padStart(2, "0")}:00.000Z`,
  }));
  const result = analyzeToolQuality([...serverCalls, ...clientCalls], { rangeDays: 30 });
  assert.equal(result.source_event_count, TOOL_QUALITY_MIN_TOOL_CALLS);
  assert.equal(result.tools[0].observed.call_count, TOOL_QUALITY_MIN_TOOL_CALLS);
  assert.equal(result.tools[0].metrics.tool_call_share, 1);
});

test("reconstructs catalog snapshots at the call timestamp and compares changed hashes", () => {
  const before = Array.from({ length: TOOL_QUALITY_MIN_TOOL_CALLS }, (_, index) => call({ started_at: `2026-09-06T04:${String(index).padStart(2, "0")}:00.000Z` }));
  const after = Array.from({ length: TOOL_QUALITY_MIN_TOOL_CALLS }, (_, index) => call({ started_at: `2026-09-06T05:${String(index).padStart(2, "0")}:00.000Z`, success: index < 27 }));
  const result = analyzeToolQuality([
    catalog("2026-09-06T03:00:00.000Z", "description-v1", "schema-v1"),
    catalog("2026-09-06T04:30:00.000Z", "description-v2", "schema-v2"),
    ...before,
    ...after,
  ], { rangeDays: 30 });
  const tool = result.tools.find((entry) => entry.name === "search")!;
  assert.equal(tool.catalog_snapshots.length, 2);
  assert.deepEqual(tool.catalog_snapshots.map((snapshot) => snapshot.schema_hash), ["schema-v1", "schema-v2"]);
  assert.equal(tool.catalog_snapshots[0].eligible_call_count, 30);
  assert.equal(tool.catalog_snapshots[1].eligible_call_count, 30);
  assert.equal(result.catalog_comparisons.length, 1);
  assert.equal(result.catalog_comparisons[0].insufficient_data.length, 0);
});

test("applies the fixed low-completion threshold only to explicit terminal outcomes", () => {
  const exactResult = analyzeToolQuality(workflowSet(16), { rangeDays: 30 });
  const exact = exactResult.tools.find((tool) => tool.name === "search")!;
  assert.equal(exact.completion_association.terminal_workflow_count, 20);
  assert.equal(exact.observed.associated_workflow_call_count, 40);
  assert.equal(exact.completion_association.explicitly_started_count, 21);
  assert.equal(exact.completion_association.completion_rate, TOOL_QUALITY_LOW_COMPLETION_THRESHOLD);
  assert.equal(exact.completion_association.status, "not_flagged");
  assert.equal(exactResult.insights.length, 0);
  assert.equal(exactResult.tool_paths.find((path) => path.path.length === 2)?.status, "not_flagged");

  const low = analyzeToolQuality(workflowSet(15), { rangeDays: 30 }).tools.find((tool) => tool.name === "search")!;
  assert.equal(low.completion_association.completion_rate, 0.75);
  assert.equal(low.completion_association.status, "associated_with_low_explicit_completion");
  const lowResult = analyzeToolQuality(workflowSet(15), { rangeDays: 30 });
  assert.equal(lowResult.insights[0].label, "Associated with low explicit completion");
  assert.deepEqual(lowResult.insights[0].path, ["search", "search"]);
  assert.match(lowResult.insights[0].detail, /association for investigation/);
});

test("returns insufficient data below tool and segment minimums", () => {
  const result = analyzeToolQuality(Array.from({ length: 10 }, (_, index) => call({ started_at: `2026-09-06T06:${String(index).padStart(2, "0")}:00.000Z` })), { rangeDays: 30 });
  const tool = result.tools[0];
  assert.equal(tool.metrics.tool_call_share, null);
  assert.equal(tool.completion_association.status, "insufficient_data");
  assert.ok(tool.insufficient_data.includes("tool_volume"));
  assert.equal(tool.breakdowns.clients[0].error_rate, null);
  assert.ok(tool.breakdowns.clients[0].insufficient_data.includes("segment_volume"));
});

test("marks a bounded source scan partial instead of displaying complete derived metrics", () => {
  const result = analyzeToolQuality(workflowSet(15), { rangeDays: 30, truncated: true });
  const tool = result.tools.find((entry) => entry.name === "search")!;
  assert.equal(result.truncated, true);
  assert.equal(tool.metrics.tool_call_share, null);
  assert.equal(tool.metrics.error_rate, null);
  assert.equal(tool.metrics.retry_rate, null);
  assert.equal(tool.metrics.observed_repeat_call_rate, null);
  assert.equal(tool.completion_association.completion_rate, null);
  assert.equal(tool.completion_association.status, "insufficient_data");
  assert.ok(tool.insufficient_data.includes("bounded_source_scan"));
  assert.ok(result.tool_paths.every((path) => path.status === "insufficient_data"));
});
