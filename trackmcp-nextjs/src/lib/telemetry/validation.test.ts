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
  const versioned = normalizeTrackMCPEvent(baseEvent({ schema_version: "1" }));
  assert.equal(versioned.ok, true);
  if (versioned.ok) assert.equal(versioned.event.schema_version, "1");
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
