import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { sanitizePayload } from "../dist/privacy.js";
import { withTrackMCP } from "../dist/index.js";

const privacy = (payload, overrides = {}) => sanitizePayload(payload, { mode: "redacted", ...overrides });

test("recursively redacts sensitive keys and explicit paths without redacting ordinary key metadata", () => {
  const result = privacy({
    password: "secret",
    customerId: "customer-secret",
    nested: { accessToken: "bearer-secret", publicKey: "useful-metadata", args: { email: "person@example.com" } },
  }, { explicitPaths: ["nested.args.email"], redactKeys: ["customer_id"] });
  assert.deepEqual(result, {
    password: "[redacted]",
    customerId: "[redacted]",
    nested: { accessToken: "[redacted]", publicKey: "useful-metadata", args: { email: "[redacted]" } },
  });
});

test("scrubs resources and emits parity-safe truncation markers", () => {
  const result = privacy({
    image: `data:image/png;base64,${"A".repeat(180)}`,
    blob: "A".repeat(180),
    bytes: new Uint8Array([1, 2, 3]),
    uri: "https://user:password@example.com/resource?access_token=secret",
    deep: { child: { value: { tooDeep: true } } },
    many: [1, 2, 3, 4],
    long: "x".repeat(30),
  }, { maxPayloadDepth: 3, maxPayloadKeys: 10, maxStringLength: 20, maxPayloadBytes: 10000 });
  assert.deepEqual(result.image, { __trackmcp_truncated: true, reason: "binary", original_type: "string", media_type: "image/png", original_bytes: 135 });
  assert.deepEqual(result.blob, { __trackmcp_truncated: true, reason: "binary", original_type: "string", original_bytes: 135 });
  assert.deepEqual(result.bytes, { __trackmcp_truncated: true, reason: "binary", original_type: "binary", original_bytes: 3 });
  assert.deepEqual(result.uri, { __trackmcp_truncated: true, reason: "credential", original_type: "string" });
  assert.deepEqual(result.deep, { child: { value: { __trackmcp_truncated: true, reason: "max_payload_depth", original_type: "object" } } });
  assert.deepEqual(privacy({ many: [1, 2, 3, 4] }, { maxPayloadKeys: 3 }).many.at(-1), { __trackmcp_truncated: true, reason: "max_payload_keys", original_type: "array" });
  assert.deepEqual(result.long, { __trackmcp_truncated: true, reason: "max_string_length", original_type: "string" });
});

test("default recursive redaction removes sensitive free text and clamps caller limits", () => {
  const result = privacy({
    email: "person@example.invalid",
    message: "Bearer eyJhbGciOiJIUzI1NiJ9.secret.signature",
    nested: { result: "-----BEGIN PRIVATE KEY-----" },
    oversized: "secret-oversized-value".repeat(5000),
  }, { maxPayloadBytes: Number.MAX_SAFE_INTEGER, maxPayloadDepth: 100, maxPayloadKeys: 1000, maxStringLength: 100000 });
  const serialized = JSON.stringify(result);
  assert.equal(serialized.includes("person@example.invalid"), false);
  assert.equal(serialized.includes("eyJhbGciOiJIUzI1NiJ9.secret.signature"), false);
  assert.equal(serialized.includes("BEGIN PRIVATE KEY"), false);
  assert.ok(new TextEncoder().encode(serialized).byteLength <= 32 * 1024);
});

test("metadata mode omits payload values and full mode remains bounded", async () => {
  const received = [];
  const server = await new Promise((resolve) => {
    const value = http.createServer((request, response) => {
      let body = "";
      request.on("data", (chunk) => { body += chunk; });
      request.on("end", () => { received.push(JSON.parse(body)); response.writeHead(200); response.end(); });
    }).listen(0, () => resolve(value));
  });
  const endpoint = `http://127.0.0.1:${server.address().port}`;
  const metadata = withTrackMCP({ request: async () => ({ ok: true }) }, { apiKey: "test", endpoint, payloadMode: "metadata", flushIntervalMs: 60000 });
  await metadata.request({ method: "tools/call", params: { name: "lookup", arguments: { password: "secret", value: "x" } } });
  await metadata.trackmcp.flush();
  const full = withTrackMCP({ request: async () => ({ ok: true }) }, { apiKey: "test", endpoint, payloadMode: "full", maxPayloadBytes: 100, flushIntervalMs: 60000 });
  await full.request({ method: "tools/call", params: { name: "lookup", arguments: { value: "x".repeat(1000) } } });
  await full.trackmcp.flush();
  await new Promise((resolve) => setTimeout(resolve, 20));
  server.close();
  const events = received.flatMap((batch) => batch.events);
  assert.equal(events[0].payload_policy, "metadata");
  assert.equal("payload" in events[0], false);
  assert.equal(events[1].payload_policy, "full");
  assert.ok(events[1].payload_size_bytes <= 100);
  assert.equal(events[1].payload.__trackmcp_truncated, true);
});

test("event hooks mutate, drop, and fail open without transmitting hook errors", async () => {
  const received = [];
  const server = await new Promise((resolve) => {
    const value = http.createServer((request, response) => {
      let body = "";
      request.on("data", (chunk) => { body += chunk; });
      request.on("end", () => { received.push(JSON.parse(body)); response.writeHead(200); response.end(); });
    }).listen(0, () => resolve(value));
  });
  const endpoint = `http://127.0.0.1:${server.address().port}`;
  const wrapped = withTrackMCP({ request: async () => ({ ok: true }) }, {
    apiKey: "test", endpoint, flushIntervalMs: 60000,
    redactEvent: (event) => ({ ...event, payload: { ...event.payload, hook: "added", password: "must-be-redacted" } }),
  });
  await wrapped.request({ method: "tools/call", params: { name: "one", arguments: {} } });
  await wrapped.trackmcp.flush();
  const dropped = withTrackMCP({ request: async () => ({ ok: true }) }, { apiKey: "test", endpoint, disabled: false, redactEvent: () => null, flushIntervalMs: 60000 });
  await dropped.request({ method: "tools/call", params: { name: "two", arguments: {} } });
  const failed = withTrackMCP({ request: async () => ({ ok: true }) }, { apiKey: "test", endpoint, redactEvent: () => { throw new Error("hook failure"); }, flushIntervalMs: 60000 });
  await failed.request({ method: "tools/call", params: { name: "three", arguments: {} } });
  await new Promise((resolve) => setTimeout(resolve, 20));
  server.close();
  assert.equal(received.length, 1);
  assert.equal(received[0].events[0].payload.hook, "added");
  assert.equal(received[0].events[0].payload.password, "[redacted]");
  assert.equal(dropped.trackmcp.getDiagnostics().droppedEvents, 1);
  assert.equal(failed.trackmcp.getDiagnostics().hookErrors, 1);
});

test("failed delivery requeues only within queue bounds", async () => {
  const wrapped = withTrackMCP({ request: async () => ({ ok: true }) }, {
    apiKey: "test", endpoint: "http://127.0.0.1:1", maxBatchSize: 100, maxQueueEvents: 3, flushIntervalMs: 60000,
  });
  for (let index = 0; index < 6; index += 1) wrapped.trackmcp.track(`event-${index}`, { value: index });
  assert.equal(wrapped.trackmcp.getDiagnostics().queuedEvents, 3);
  await wrapped.trackmcp.flush();
  assert.equal(wrapped.trackmcp.getDiagnostics().queuedEvents, 3);
  assert.ok(wrapped.trackmcp.getDiagnostics().droppedEvents >= 3);
  const byteBound = withTrackMCP({ request: async () => ({ ok: true }) }, {
    apiKey: "test", endpoint: "http://127.0.0.1:1", maxBatchSize: 100, maxQueueEvents: 100, maxQueueBytes: 700, flushIntervalMs: 60000,
  });
  for (let index = 0; index < 8; index += 1) byteBound.trackmcp.track(`byte-event-${index}`, { value: "x".repeat(20) });
  assert.ok(byteBound.trackmcp.getDiagnostics().queuedBytes <= 700);
});
