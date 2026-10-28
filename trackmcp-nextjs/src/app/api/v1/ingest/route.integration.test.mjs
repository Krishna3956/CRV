import assert from "node:assert/strict";
import http from "node:http";
import test from "node:test";
import { withTrackMCP } from "../../../../../packages/typescript-sdk/dist/index.js";
import { DEFAULT_MAX_PAYLOAD_BYTES } from "../../../../../packages/typescript-sdk/dist/privacy.js";
import { createIngestHandler } from "./handlers.ts";
import { hashTrackMCPKey } from "../../../../lib/telemetry/keys.ts";
import { MAX_BATCH_EVENTS, MAX_PAYLOAD_BYTES, MAX_REQUEST_BYTES } from "../../../../lib/telemetry/validation.ts";

const API_KEY = "tmcp_integration_key";
const WORKSPACE_A_KEY = "tmcp_workspace_a_key";
const WORKSPACE_B_KEY = "tmcp_workspace_b_key";
const WORKSPACE_A_ROTATED_KEY = "tmcp_workspace_a_rotated_key";
const SCOPED_KEY = "tmcp_scoped_key";

function fakeAdmin() {
  const state = { rows: [], refreshRows: [], registryRows: [] };
  const keys = new Map([
    [hashTrackMCPKey(API_KEY), { id: "key-workspace-integration", workspace_id: "workspace-integration", revoked_at: null }],
    [hashTrackMCPKey(WORKSPACE_A_KEY), { id: "key-workspace-a", workspace_id: "workspace-a", revoked_at: null }],
    [hashTrackMCPKey(WORKSPACE_A_ROTATED_KEY), { id: "key-workspace-a-rotated", workspace_id: "workspace-a", revoked_at: null }],
    [hashTrackMCPKey(SCOPED_KEY), { id: "key-scoped", workspace_id: "workspace-a", service_scope: "scoped-service", environment_scope: "production", revoked_at: null }],
    [hashTrackMCPKey(WORKSPACE_B_KEY), { id: "key-workspace-b", workspace_id: "workspace-b", revoked_at: null }],
  ]);
  const admin = {
    from(table) {
      if (table === "trackmcp_api_keys") {
        return {
          filters: {},
          select() { return this; },
          eq(column, value) { this.filters[column] = value; return this; },
          async maybeSingle() {
            return { data: keys.get(this.filters.key_hash) ?? null, error: null };
          },
        };
      }
      if (table === "trackmcp_refresh_jobs") {
        return {
          upsert(rows) { state.refreshRows.push(...rows); return Promise.resolve({ error: null }); },
        };
      }
      if (table === "trackmcp_servers") {
        return {
          upsert(rows) { state.registryRows.push(...rows); return Promise.resolve({ error: null }); },
        };
      }
      return {
        select() { return this; },
        eq() { return this; },
        in(_column, values) {
          const ids = new Set(values);
          return Promise.resolve({ data: state.rows.filter((row) => ids.has(row.event_id)).map((row) => ({ event_id: row.event_id })), error: null });
        },
        insert() { return Promise.resolve({ error: null }); },
        upsert(rows) { state.rows.push(...rows); return Promise.resolve({ error: null }); },
      };
    },
  };
  return { admin, state, keys };
}

function event(overrides = {}) {
  return {
    schema_version: "1",
    observation_source: "server",
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

async function postWithKey(handler, key, body) {
  const response = await handler(new Request("http://integration.test/api/v1/ingest", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  }));
  return { status: response.status, body: await response.json() };
}

async function postWithHeaders(handler, body, headers = {}) {
  const response = await handler(new Request("http://integration.test/api/v1/ingest", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
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
  // The bearer credential is authentication material, never telemetry data.
  // Keep this assertion at the route boundary so a future mapper change
  // cannot accidentally persist headers or the raw key.
  assert.equal(JSON.stringify(stored).includes(API_KEY), false);
  assert.equal("authorization" in stored, false);
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

test("route integration materializes a tenant-scoped server registry row for catalog projection", async () => {
  const { admin, state } = fakeAdmin();
  const handler = createIngestHandler(() => admin);
  const serverId = "11111111-1111-4111-8111-111111111111";
  const result = await post(handler, { events: [event({ event_id: "registry-event", server_id: serverId, catalog_kind: "tools", catalog_item_count: 1 })] });
  assert.equal(result.status, 200);
  assert.equal(state.registryRows.length, 1);
  assert.deepEqual(state.registryRows[0], {
    id: serverId,
    workspace_id: "workspace-integration",
    name: "MCP server 11111111",
    slug: `server-${serverId}`,
  });
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

test("route integration preserves intent provenance, missing reports, correlation, and privacy rejection", async () => {
  const { admin, state } = fakeAdmin();
  const handler = createIngestHandler(() => admin);
  const accepted = await post(handler, {
    events: [event({
      event_id: "intent-event",
      context: "Find the relevant documentation",
      intent_source: "external_callback",
      missing_capability: "bulk_export",
      correlation_handle: "job_anon_1",
      correlation_handle_source: "external",
    }), event({
      event_id: "missing-event",
      event_type: "custom",
      mcp_method: "trackmcp_report_missing",
      missing_capability: "repository_search",
      intent_source: "missing",
    })],
  });
  assert.equal(accepted.status, 200);
  assert.equal(state.rows[0].intent_source, "external_callback");
  assert.equal(state.rows[0].observation_source, "server");
  assert.equal(state.rows[0].context, "Find the relevant documentation");
  assert.equal(state.rows[0].missing_capability, "bulk_export");
  assert.equal(state.rows[0].correlation_handle_source, "external");
  assert.equal(state.rows[1].mcp_method, "trackmcp_report_missing");
  assert.equal(state.rows[1].intent_source, "missing");

  const unsafe = await post(handler, { events: [event({ event_id: "unsafe-context", context: "Bearer should-not-persist", intent_source: "context_parameter" })] });
  assert.equal(unsafe.status, 400);
  const oversized = await post(handler, { events: [event({ event_id: "oversized-context", context: "x".repeat(2049), intent_source: "context_parameter" })] });
  assert.equal(oversized.status, 400);
  const unauthorized = await postWithHeaders(handler, { events: [event({ event_id: "unauthorized" })] });
  assert.equal(unauthorized.status, 401);
});

test("route integration persists only the hashed account identity contract", async () => {
  const { admin, state } = fakeAdmin();
  const handler = createIngestHandler(() => admin);
  const accountKey = "a".repeat(64);
  const accepted = await post(handler, { events: [event({
    event_id: "account-event",
    account_key: accountKey,
    account_identity_source: "resolver",
  })] });
  assert.equal(accepted.status, 200);
  assert.equal(state.rows[0].account_key, accountKey);
  assert.equal(state.rows[0].account_identity_source, "resolver");
  assert.equal(state.rows[0].account_identity_version, "sha256-v1");

  const rawAccount = await post(handler, { events: [event({
    event_id: "raw-account-event",
    account_key: "workspace:acme",
    account_identity_source: "resolver",
  })] });
  assert.equal(rawAccount.status, 400);
  const unsupportedVersion = await post(handler, { events: [event({
    event_id: "unsupported-account-version",
    account_key: accountKey,
    account_identity_source: "resolver",
    account_identity_version: "sha256-v2",
  })] });
  assert.equal(unsupportedVersion.status, 400);
});

test("legacy events remain source-null while versioned events require provenance", async () => {
  const { admin, state } = fakeAdmin();
  const handler = createIngestHandler(() => admin);
  const legacy = event({ event_id: "legacy-event" });
  delete legacy.schema_version;
  delete legacy.observation_source;
  const accepted = await post(handler, { events: [legacy] });
  assert.equal(accepted.status, 200);
  assert.equal(state.rows[0].observation_source, null);
  const rejected = await post(handler, { events: [event({ event_id: "missing-source", observation_source: undefined })] });
  assert.equal(rejected.status, 400);
});

test("mixed valid and invalid batches are rejected atomically before persistence", async () => {
  const { admin, state } = fakeAdmin();
  const handler = createIngestHandler(() => admin);
  const response = await post(handler, {
    events: [
      event({ event_id: "mixed-valid-event" }),
      event({ event_id: "mixed-invalid-event", started_at: "not-a-timestamp" }),
    ],
  });
  assert.equal(response.status, 400);
  assert.equal(response.body.accepted, 0);
  assert.equal(response.body.rejected, 1);
  assert.equal(state.rows.length, 0, "a rejected batch must not partially persist valid events");
});

test("accepted telemetry enqueues bounded derived work without exposing or depending on raw event data", async () => {
  const { admin, state } = fakeAdmin();
  const handler = createIngestHandler(() => admin, { refreshJobsEnabled: true });
  const response = await post(handler, { events: [event({ event_id: "refresh-enqueue-event", payload: { secret: "never-in-queue" } })] });
  assert.equal(response.status, 200);
  assert.equal(response.body.accepted, 1);
  assert.deepEqual(state.refreshRows.map((row) => row.kind).sort(), ["action_queue_refresh", "catalog_entity_recompute", "catalog_recompute", "fact_projection"]);
  assert.equal(state.refreshRows.every((row) => row.workspace_id === "workspace-integration" && row.dedupe_key.startsWith("ingest-window:")), true);
  assert.equal(state.refreshRows.every((row) => /ingest-window:\d+:[a-f0-9]{64}:[a-z_]+$/.test(row.dedupe_key)), true);
  assert.equal(JSON.stringify(state.refreshRows).includes("never-in-queue"), false);
  assert.equal(JSON.stringify(state.refreshRows).includes("refresh-enqueue-event"), false);
});

test("replaying the same workspace event is durably idempotent at the ingest boundary", async () => {
  const { admin, state } = fakeAdmin();
  const handler = createIngestHandler(() => admin);
  const first = await post(handler, { events: [event({ event_id: "replay-safe-event" })] });
  assert.equal(first.status, 200);
  assert.equal(first.body.accepted, 1);
  assert.equal(first.body.ignored_duplicates, 0);
  const storedCount = state.rows.filter((row) => row.event_id === "replay-safe-event").length;

  const replay = await post(handler, { events: [event({ event_id: "replay-safe-event" })] });
  assert.equal(replay.status, 200);
  assert.equal(replay.body.accepted, 0);
  assert.equal(replay.body.ignored_duplicates, 1);
  assert.equal(state.rows.filter((row) => row.event_id === "replay-safe-event").length, storedCount);
});

test("feature-flagged Founder OS writes remain best-effort and fail-open", async () => {
  const { admin, state } = fakeAdmin();
  const previous = process.env.TRACKMCP_ENABLE_FACT_WRITES;
  process.env.TRACKMCP_ENABLE_FACT_WRITES = "true";
  try {
    const handler = createIngestHandler(() => admin);
    const accepted = await post(handler, { events: [event({ event_id: "fact-write-event", success: true })] });
    assert.equal(accepted.status, 200);
    assert.equal(accepted.body.accepted, 1);
    assert.ok(state.rows.length >= 2, "raw event and derived fact should be attempted");
  } finally {
    if (previous === undefined) delete process.env.TRACKMCP_ENABLE_FACT_WRITES;
    else process.env.TRACKMCP_ENABLE_FACT_WRITES = previous;
  }
});

test("derived fact writes are disabled by default", async () => {
  const { admin, state } = fakeAdmin();
  const previous = process.env.TRACKMCP_ENABLE_FACT_WRITES;
  delete process.env.TRACKMCP_ENABLE_FACT_WRITES;
  try {
    const handler = createIngestHandler(() => admin);
    const accepted = await post(handler, { events: [event({ event_id: "fact-writes-disabled" })] });
    assert.equal(accepted.status, 200);
    assert.equal(accepted.body.accepted, 1);
    assert.equal(state.rows.length, 1, "the disabled flag must not create derived fact rows");
  } finally {
    if (previous === undefined) delete process.env.TRACKMCP_ENABLE_FACT_WRITES;
    else process.env.TRACKMCP_ENABLE_FACT_WRITES = previous;
  }
});

test("ingest derives tenant scope from the authenticated key and ignores caller workspace claims", async () => {
  const { admin, state } = fakeAdmin();
  const handler = createIngestHandler(() => admin);
  const response = await postWithKey(handler, WORKSPACE_A_KEY, {
    events: [event({ event_id: "workspace-a-event", workspace_id: "workspace-b", service: "tenant-a" })],
  });
  assert.equal(response.status, 200);
  assert.equal(response.body.accepted, 1);
  assert.equal(state.rows.at(-1).workspace_id, "workspace-a");
  assert.equal(state.rows.some((row) => row.workspace_id === "workspace-b"), false);
});

test("scoped connection keys reject mismatched service or environment labels", async () => {
  const { admin, state } = fakeAdmin();
  const handler = createIngestHandler(() => admin);
  const accepted = await postWithKey(handler, SCOPED_KEY, { events: [event({ event_id: "scoped-accepted", service: "scoped-service", environment: "production" })] });
  assert.equal(accepted.status, 200);
  const rejectedService = await postWithKey(handler, SCOPED_KEY, { events: [event({ event_id: "scoped-wrong-service", service: "other-service", environment: "production" })] });
  assert.equal(rejectedService.status, 403);
  const rejectedEnvironment = await postWithKey(handler, SCOPED_KEY, { events: [event({ event_id: "scoped-wrong-environment", service: "scoped-service", environment: "staging" })] });
  assert.equal(rejectedEnvironment.status, 403);
  assert.equal(state.rows.some((row) => row.event_id === "scoped-wrong-service" || row.event_id === "scoped-wrong-environment"), false);
});

test("revocation is enforced on the next ingest and rotation supports explicit overlap", async () => {
  const { admin, state, keys } = fakeAdmin();
  const handler = createIngestHandler(() => admin);
  const beforeRevoke = await postWithKey(handler, WORKSPACE_A_KEY, { events: [event({ event_id: "before-revoke" })] });
  assert.equal(beforeRevoke.status, 200);

  // A new key can overlap briefly while the service is rotated.
  const overlap = await postWithKey(handler, WORKSPACE_A_ROTATED_KEY, { events: [event({ event_id: "during-overlap" })] });
  assert.equal(overlap.status, 200);
  assert.equal(state.rows.at(-1).workspace_id, "workspace-a");

  keys.get(hashTrackMCPKey(WORKSPACE_A_KEY)).revoked_at = new Date().toISOString();
  const oldKeyAfterRevoke = await postWithKey(handler, WORKSPACE_A_KEY, { events: [event({ event_id: "old-after-revoke" })] });
  assert.equal(oldKeyAfterRevoke.status, 401);
  assert.equal(state.rows.some((row) => row.event_id === "old-after-revoke"), false);

  const newKeyAfterRotation = await postWithKey(handler, WORKSPACE_A_ROTATED_KEY, { events: [event({ event_id: "new-after-rotation" })] });
  assert.equal(newKeyAfterRotation.status, 200);
  assert.equal(state.rows.at(-1).workspace_id, "workspace-a");
});
