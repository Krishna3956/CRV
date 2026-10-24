import assert from "node:assert/strict";
import test from "node:test";
import { projectTrackMCPFact } from "./facts.ts";
import type { CanonicalTrackMCPEvent } from "./types.ts";

const event = (overrides: Partial<CanonicalTrackMCPEvent> = {}): CanonicalTrackMCPEvent => ({
  schema_version: "1",
  event_id: "evt_fact_1",
  event_type: "tool_call",
  service: "fixture",
  environment: "test",
  observation_source: "server",
  session_id: "session_private",
  started_at: "2026-10-18T00:00:00Z",
  ...overrides,
});

test("projects tool calls as bounded activity facts", () => {
  const fact = projectTrackMCPFact(event({ tool_name: "search", success: true, duration_ms: 20 }));
  assert.equal(fact.fact_type, "activity");
  assert.equal(fact.semantic.outcome, "completed");
  assert.deepEqual(fact.measures, { duration_ms: 20, payload_size_bytes: undefined, retry_number: undefined });
  assert.equal(fact.dimensions.tool_name, "search");
  assert.equal("payload" in fact, false);
});

test("persists only a coarse protocol family in durable facts", () => {
  const fact = projectTrackMCPFact(event({ event_type: "protocol", mcp_method: "elicitation/create", result_type: "input_required" }));
  assert.equal(fact.dimensions.protocol_family, "elicitation");
  assert.equal(JSON.stringify(fact).includes("elicitation/create"), false);
});

test("persists allowlisted lifecycle signals in the durable semantic fact", () => {
  const fact = projectTrackMCPFact(event({ event_type: "protocol", mcp_method: "subscriptions/listen", success: true }));
  assert.equal(fact.fact_type, "lifecycle");
  assert.equal(fact.semantic.protocol_signal, "subscription_started");
  assert.equal(JSON.stringify(fact).includes("subscriptions/listen"), false);
});

test("persists an allowlisted family hint when the method name is unavailable", () => {
  const fact = projectTrackMCPFact(event({ event_type: "protocol", payload: { _trackmcp: { protocol_family: "sampling", prompt: "private" } }, result_type: "complete" }));
  assert.equal(fact.dimensions.protocol_family, "sampling");
  assert.equal(JSON.stringify(fact).includes("private"), false);
  assert.equal(JSON.stringify(fact).includes("protocol_family"), true);
});

test("projects workflow outcomes without treating missing evidence as success", () => {
  const fact = projectTrackMCPFact(event({ event_type: "workflow", workflow_id: "wf_private" }));
  assert.equal(fact.fact_type, "outcome");
  assert.equal(fact.semantic.outcome, "unknown");
  assert.equal(fact.semantic.reason, "missing_terminal_signal");
});

test("bounds dimensions and numeric measures", () => {
  const fact = projectTrackMCPFact(event({
    event_id: "x".repeat(500),
    service: "s".repeat(500),
    tool_name: "t".repeat(500),
    duration_ms: 999_999_999,
    payload_size_bytes: -1,
    retry_number: 999_999,
    error_class: "e".repeat(500),
    error_code: 503,
    account_key: "a".repeat(200),
  }));
  assert.equal(fact.source_event_id.length, 128);
  assert.equal(fact.service.length, 128);
  assert.equal(fact.dimensions.tool_name?.length, 256);
  assert.equal(fact.measures.duration_ms, 86_400_000);
  assert.equal(fact.measures.payload_size_bytes, 0);
  assert.equal(fact.measures.retry_number, 1_000);
  assert.equal(fact.error?.class?.length, 128);
  assert.equal(fact.dimensions.account_key?.length, 64);
});

test("projects bounded MRTR request counts without request contents", () => {
  const fact = projectTrackMCPFact(event({ input_request_count: 101, input_response_count: 2 }));
  assert.equal(fact.measures.input_request_count, 100);
  assert.equal(fact.measures.input_response_count, 2);
});

test("projects bounded completion friction metadata without suggestion values", () => {
  const fact = projectTrackMCPFact(event({
    event_type: "protocol",
    mcp_method: "completion/complete",
    payload: { _trackmcp: {
      observation_kind: "protocol_response",
      protocol_family: "completion",
      completion_value_count: 99,
      completion_total: 2_000_000,
      completion_has_more: true,
      values: [{ value: "private" }],
    } },
  }));
  assert.equal(fact.dimensions.protocol_family, "completion");
  assert.equal(fact.dimensions.protocol_observation_kind, "protocol_response");
  assert.equal(fact.measures.completion_value_count, 32);
  assert.equal(fact.measures.completion_total, 1_000_000);
  assert.equal(fact.measures.completion_has_more, true);
  assert.equal(JSON.stringify(fact).includes("private"), false);
});

test("keeps only the bounded account key and never raw event payload", () => {
  const fact = projectTrackMCPFact(event({ account_key: "a".repeat(64), payload: { email: "person@example.com", token: "secret" } }));
  assert.equal(fact.dimensions.account_key, "a".repeat(64));
  assert.equal("payload" in fact, false);
  assert.equal(JSON.stringify(fact).includes("person@example.com"), false);
  assert.equal(JSON.stringify(fact).includes("secret"), false);
});
