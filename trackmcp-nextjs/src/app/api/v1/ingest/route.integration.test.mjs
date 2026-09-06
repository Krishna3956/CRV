import assert from "node:assert/strict";
import http from "node:http";
import test from "node:test";
import { withTrackMCP } from "../../../../../packages/typescript-sdk/dist/index.js";
import { DEFAULT_MAX_PAYLOAD_BYTES } from "../../../../../packages/typescript-sdk/dist/privacy.js";
import { createIngestHandler } from "./route.ts";
import { MAX_BATCH_EVENTS, MAX_PAYLOAD_BYTES, MAX_REQUEST_BYTES } from "../../../../lib/telemetry/validation.ts";

const API_KEY = "tmcp_integration_key";

function fakeAdmin() {
  const state = { rows: [] };
  const admin = {
    from(table) {
      if (table === "trackmcp_api_keys") {
        return {
          select() { return this; },
          eq() { return this; },
          maybeSingle: async () => ({ data: { workspace_id: "workspace-integration", revoked_at: null }, error: null }),
        };
      }
      return {
        select() { return this; },
        eq() { return this; },
        in() { return Promise.resolve({ data: [], error: null }); },
        upsert(rows) { state.rows.push(...rows); return Promise.resolve({ error: null }); },
      };
    },
  };
  return { admin, state };
}

function event(overrides = {}) {
  return {
    schema_version: "1",
    event_id: "integration-event",
    event_type: "tool_call",
    service: "integration",
    environment: "test",
    started_at: "2026-09-06T00:00:00Z",
    payload: { result: { ok: true } },
    ...overrides,
  };
}

async function post(handler, body) {
  const response = await handler(new Request("http://integration.test/api/v1/ingest", {
    method: "POST",
    headers: { authorization: `Bearer ${API_KEY}`, "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  }));
  return { status: response.status, body: await response.json() };
}

test("route integration scrubs non-SDK payloads, enforces limits, and preserves the SDK byte budget", async () => {
  const { admin, state } = fakeAdmin();
  const handler = createIngestHandler(() => admin);
  const scrubbed = await post(handler, {
    events: [event({
      payload: {
        password: "do-not-store",
        nested: { apiKey: "do-not-store", authorization: "Bearer do-not-store", public: "keep" },
        credentialText: "api_key=do-not-store",
      },
    })],
  });
  assert.equal(scrubbed.status, 200);
  assert.equal(scrubbed.body.accepted, 1);
  const stored = state.rows[0];
  const storedText = JSON.stringify(stored.payload);
  assert.equal(stored.payload.password, "[redacted]");
  assert.equal(stored.payload.nested.apiKey, "[redacted]");
  assert.equal(stored.payload.nested.authorization, "[redacted]");
  assert.equal(stored.payload.nested.public, "keep");
  assert.equal(stored.payload.credentialText, "[redacted]");
  assert.equal(storedText.includes("do-not-store"), false);
  assert.equal(stored.payload_size_bytes, new TextEncoder().encode(JSON.stringify(stored.payload)).byteLength);

  const oversizedRequest = await post(handler, `{"events":[]}${" ".repeat(MAX_REQUEST_BYTES)}`);
  assert.equal(oversizedRequest.status, 413);
  const oversizedPayload = await post(handler, { events: [event({ event_id: "oversized-payload", payload: { value: "x".repeat(MAX_PAYLOAD_BYTES) } })] });
  assert.equal(oversizedPayload.status, 400);
  const oversizedBatch = await post(handler, { events: Array.from({ length: MAX_BATCH_EVENTS + 1 }, (_, index) => event({ event_id: `batch-${index}` })) });
  assert.equal(oversizedBatch.status, 413);

  assert.equal(DEFAULT_MAX_PAYLOAD_BYTES, 32 * 1024);
  assert.equal(MAX_PAYLOAD_BYTES, 128 * 1024);
  assert.ok(DEFAULT_MAX_PAYLOAD_BYTES < MAX_PAYLOAD_BYTES);
});

test("route integration receives hook-sanitized events within the final SDK payload budget", async () => {
  const { admin, state } = fakeAdmin();
  const handler = createIngestHandler(() => admin);
  const bridge = http.createServer(async (request, response) => {
    let raw = "";
    for await (const chunk of request) raw += chunk;
    const result = await handler(new Request("http://bridge.test/api/v1/ingest", {
      method: request.method,
      headers: request.headers,
      body: raw,
    }));
    response.writeHead(result.status, { "content-type": "application/json" });
    response.end(JSON.stringify(await result.json()));
  });
  await new Promise((resolve) => bridge.listen(0, resolve));
  const wrapped = withTrackMCP({ request: async () => ({ ok: true }) }, {
    apiKey: API_KEY,
    endpoint: `http://127.0.0.1:${bridge.address().port}`,
    maxPayloadBytes: 100,
    flushIntervalMs: 60000,
    redactEvent: (captured) => ({ ...captured, payload: { ...captured.payload, hookAddedSecret: "x".repeat(10000) } }),
  });
  await wrapped.request({ method: "tools/call", params: { name: "lookup", arguments: {} } });
  await wrapped.trackmcp.flush();
  await new Promise((resolve) => setTimeout(resolve, 20));
  bridge.close();

  const stored = state.rows.at(-1);
  assert.ok(stored);
  assert.ok(stored.payload_size_bytes <= 100);
  assert.equal(stored.payload.__trackmcp_truncated, true);
  assert.equal(JSON.stringify(stored.payload).includes("hookAddedSecret"), false);
});
