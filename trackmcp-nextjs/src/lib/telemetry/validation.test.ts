import assert from "node:assert/strict";
import test from "node:test";
import { deduplicateEvents, MAX_EVENT_BYTES, MAX_PAYLOAD_BYTES, normalizeTrackMCPEvent, sanitizeIngestPayload } from "./validation.ts";

const baseEvent = (overrides: Record<string, unknown> = {}) => ({
  event_id: "evt_123",
  event_type: "tool_call",
  service: "fixture",
  environment: "test",
  started_at: "2026-09-06T00:00:00Z",
  ...overrides,
});

test("normalizes legacy and accepts versioned events", () => {
  const legacy = normalizeTrackMCPEvent(baseEvent());
  assert.equal(legacy.ok, true);
  if (legacy.ok) assert.equal(legacy.event.schema_version, "legacy");
  const versioned = normalizeTrackMCPEvent(baseEvent({ schema_version: "1", observation_source: "server" }));
  assert.equal(versioned.ok, true);
  if (versioned.ok) assert.equal(versioned.event.schema_version, "1");
  assert.equal(normalizeTrackMCPEvent(baseEvent({ schema_version: "1", observation_source: "invalid" })).ok, false);
  assert.equal(normalizeTrackMCPEvent(baseEvent({ schema_version: "1" })).ok, false);
});

test("rejects invalid event types, IDs, timestamps, and negative measurements", () => {
  assert.equal(normalizeTrackMCPEvent(baseEvent({ event_type: "unknown" })).ok, false);
  assert.equal(normalizeTrackMCPEvent(baseEvent({ event_id: "" })).ok, false);
  assert.equal(normalizeTrackMCPEvent(baseEvent({ started_at: "not-a-timestamp" })).ok, false);
  for (const field of ["duration_ms", "retry_number", "payload_size_bytes"]) {
    assert.equal(normalizeTrackMCPEvent(baseEvent({ [field]: -1 })).ok, false);
  }
});

test("rejects oversized payloads and serialized events", () => {
  assert.equal(normalizeTrackMCPEvent(baseEvent({ payload: { value: "x".repeat(MAX_PAYLOAD_BYTES) } })).ok, false);
  assert.equal(normalizeTrackMCPEvent(baseEvent({ payload: { value: "x".repeat(MAX_EVENT_BYTES) } })).ok, false);
});

test("deduplicates within a batch and against stored IDs", () => {
  const first = normalizeTrackMCPEvent(baseEvent({ event_id: "evt_1" }));
  const second = normalizeTrackMCPEvent(baseEvent({ event_id: "evt_2" }));
  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  if (!first.ok || !second.ok) return;
  const result = deduplicateEvents([first.event, first.event, second.event], new Set(["evt_2"]));
  assert.deepEqual(result.events.map((event) => event.event_id), ["evt_1"]);
  assert.equal(result.ignored, 2);
});

test("ingest scrubs secrets, bearer tokens, credentialed URLs, and resource blobs defensively", () => {
  const result = sanitizeIngestPayload({
    nested: { authorization: "Bearer top-secret", apiKey: "secret", publicKey: "keep" },
    resource: "data:image/png;base64,AAAA",
    blob: "A".repeat(180),
    uri: "https://user:password@example.com/resource?access_token=secret",
  });
  assert.equal((result.nested as Record<string, unknown>).authorization, "[redacted]");
  assert.equal((result.nested as Record<string, unknown>).apiKey, "[redacted]");
  assert.equal((result.nested as Record<string, unknown>).publicKey, "keep");
  assert.equal((result.resource as Record<string, unknown>).reason, "binary");
  assert.equal((result.blob as Record<string, unknown>).reason, "binary");
  assert.equal(result.uri, "[redacted]");
});

test("ingest applies an explicit reserved metadata allowlist", () => {
  const result = sanitizeIngestPayload({
    _trackmcp: {
      observation_kind: "protocol_response",
      protocol_family: "tools",
      capability_names: ["tools", "resources", "secret-capability"],
      completion_total: 12,
      private_nested: { token: "must-not-cross" },
      unknown_scalar: "must-not-cross",
    },
  });
  assert.deepEqual(result._trackmcp, {
    observation_kind: "protocol_response",
    protocol_family: "tools",
    capability_names: ["tools", "resources", "secret-capability"],
    completion_total: 12,
  });
});

test("ingest bounds deeply nested and oversized payload shapes", () => {
  const result = sanitizeIngestPayload({
    array: Array.from({ length: 140 }, (_, index) => index),
    nested: { a: { b: { c: { d: { e: { f: { g: { h: { i: { j: { k: "too-deep" } } } } } } } } } } },
    keys: Object.fromEntries(Array.from({ length: 70 }, (_, index) => [`key_${index}`, index])),
  });
  assert.equal(Array.isArray(result.array), true);
  assert.equal((result.array as unknown[]).length, 129);
  assert.equal(((result.array as unknown[]).at(-1) as Record<string, unknown>).reason, "max_payload_items");
  assert.equal((result.nested as Record<string, unknown>).a !== undefined, true);
  assert.equal((result.keys as Record<string, unknown>).__trackmcp_truncated, true);
});

test("validates bounded correlation handles without inferring them from request IDs", () => {
  const valid = normalizeTrackMCPEvent(baseEvent({ correlation_handle: "job_anon_1", correlation_handle_source: "external", request_id: "job_anon_1" }));
  assert.equal(valid.ok, true);
  const missingSource = normalizeTrackMCPEvent(baseEvent({ correlation_handle: "job_anon_1" }));
  assert.equal(missingSource.ok, false);
  const token = normalizeTrackMCPEvent(baseEvent({ correlation_handle: "Bearer_secret", correlation_handle_source: "external" }));
  assert.equal(token.ok, false);
  const oversized = normalizeTrackMCPEvent(baseEvent({ correlation_handle: "x".repeat(129), correlation_handle_source: "external" }));
  assert.equal(oversized.ok, false);
  const noHandle = normalizeTrackMCPEvent(baseEvent({ request_id: "request-1" }));
  assert.equal(noHandle.ok, true);
  if (noHandle.ok) assert.equal(noHandle.event.correlation_handle, undefined);
});

test("validates explicit intent provenance and rejects unsafe context", () => {
  const context = normalizeTrackMCPEvent(baseEvent({ context: "Find the relevant documentation", intent_source: "context_parameter" }));
  assert.equal(context.ok, true);
  const external = normalizeTrackMCPEvent(baseEvent({ context: "Resolve the deployment issue", intent_source: "external_callback" }));
  assert.equal(external.ok, true);
  const fallback = normalizeTrackMCPEvent(baseEvent({ context: "Complete the lookup", intent_source: "fallback" }));
  assert.equal(fallback.ok, true);
  const missing = normalizeTrackMCPEvent(baseEvent({ intent_source: "missing" }));
  assert.equal(missing.ok, true);
  assert.equal(normalizeTrackMCPEvent(baseEvent({ context: "Bearer secret", intent_source: "context_parameter" })).ok, false);
  assert.equal(normalizeTrackMCPEvent(baseEvent({ context: "x".repeat(2049), intent_source: "context_parameter" })).ok, false);
  assert.equal(normalizeTrackMCPEvent(baseEvent({ context: "goal", intent_source: "missing" })).ok, false);
  assert.equal(normalizeTrackMCPEvent(baseEvent({ intent_source: "fallback" })).ok, false);
  assert.equal(normalizeTrackMCPEvent(baseEvent({ missing_capability: "bulk_export" })).ok, true);
});

test("accepts bounded protocol result and retry linkage without accepting request contents", () => {
  const valid = normalizeTrackMCPEvent(baseEvent({
    mcp_method: "prompts/get",
    result_type: "input_required",
    interaction_id: "interaction_1",
    interaction_link_source: "issued",
    retry_of_event_id: "evt_previous",
    request_state_hash: "a".repeat(64),
    input_request_count: 3,
    input_response_count: 2,
    resource_audience: "assistant",
    resource_priority: 0.75,
  }));
  assert.equal(valid.ok, true);
  assert.equal(normalizeTrackMCPEvent(baseEvent({ result_type: "paused" })).ok, false);
  assert.equal(normalizeTrackMCPEvent(baseEvent({ interaction_id: "x", interaction_link_source: "missing" })).ok, false);
  assert.equal(normalizeTrackMCPEvent(baseEvent({ request_state_hash: "secret" })).ok, false);
  assert.equal(normalizeTrackMCPEvent(baseEvent({ input_request_count: 101 })).ok, false);
  assert.equal(normalizeTrackMCPEvent(baseEvent({ resource_priority: 2 })).ok, false);
});

test("recovers typed catalog metadata from bounded legacy method and hash fields", () => {
  const result = normalizeTrackMCPEvent(baseEvent({
    event_type: "catalog",
    mcp_method: "tools/list",
    catalog_item_name_hashes: ["a".repeat(64), "b".repeat(64)],
    payload: { name: "tools_discovered" },
  }));
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.event.catalog_kind, "tools");
    assert.equal(result.event.catalog_item_count, 2);
  }
});

test("recovers read entity kind from bounded MCP method without inspecting content", () => {
  const resource = normalizeTrackMCPEvent(baseEvent({
    mcp_method: "resources/read",
    catalog_item_uri_hashes: ["a".repeat(64)],
  }));
  assert.equal(resource.ok, true);
  if (resource.ok) assert.equal(resource.event.catalog_kind, "resources");

  const prompt = normalizeTrackMCPEvent(baseEvent({
    mcp_method: "prompts/get",
    catalog_item_name_hashes: ["b".repeat(64)],
  }));
  assert.equal(prompt.ok, true);
  if (prompt.ok) assert.equal(prompt.event.catalog_kind, "prompts");
});

test("accepts task result handles only when a task id is present", () => {
  assert.equal(normalizeTrackMCPEvent(baseEvent({ result_type: "task", task_id: "task_1" })).ok, true);
  const invalid = normalizeTrackMCPEvent(baseEvent({ result_type: "task" }));
  assert.equal(invalid.ok, false);
  if (!invalid.ok) assert.equal(invalid.reason, "task result_type requires task_id");
});

test("accepts bounded explicit task states and rejects unknown states", () => {
  assert.equal(normalizeTrackMCPEvent(baseEvent({ task_id: "task_1", task_status: "working" })).ok, true);
  const invalid = normalizeTrackMCPEvent(baseEvent({ task_id: "task_1", task_status: "running" }));
  assert.equal(invalid.ok, false);
  if (!invalid.ok) assert.equal(invalid.reason, "task_status is unsupported");
});
