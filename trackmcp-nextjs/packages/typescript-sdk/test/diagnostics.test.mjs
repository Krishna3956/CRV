import test from "node:test";
import assert from "node:assert/strict";
import { TrackMCPClient, withTrackMCP } from "../dist/index.js";

test("missing API key disables telemetry, emits one actionable diagnostic, and preserves MCP calls", async () => {
  const diagnostics = [];
  const warnings = [];
  const originalWarn = console.warn;
  console.warn = (message) => warnings.push(String(message));
  try {
    const wrapped = withTrackMCP({ async request() { return { ok: true }; } }, { onDeliveryError: (error) => diagnostics.push(error) });
    const result = await wrapped.request({ method: "tools/call", params: { name: "safe" } });
    assert.deepEqual(result, { ok: true });
    assert.deepEqual(diagnostics, [{ kind: "missing_api_key", retrying: false }]);
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /TRACKMCP_KEY/);
    assert.match(warnings[0], /app\.trackmcp\.com\/signup/);
    assert.equal(warnings[0].includes("undefined"), false);
    assert.equal(wrapped.trackmcp.getDiagnostics().queuedEvents, 0);
  } finally {
    console.warn = originalWarn;
  }
});

test("strict missing-key mode uses the same secret-free actionable message", () => {
  assert.throws(() => new TrackMCPClient({ strict: true }), /TRACKMCP_KEY.*app\.trackmcp\.com\/signup/);
});

test("delivery failures are categorized and remain fail-open", async () => {
  const originalFetch = globalThis.fetch;
  const originalWarn = console.warn;
  const warnings = [];
  console.warn = (message) => warnings.push(String(message));
  try {
    for (const [status, expected] of [[400, "invalid_key"], [401, "unauthorized"], [403, "forbidden"], [429, "rate_limited"], [500, "server_error"]]) {
      const received = [];
      globalThis.fetch = async () => new Response("", { status });
      const wrapped = withTrackMCP({ async request() { return { ok: true }; } }, { apiKey: "tmcp_diagnostic_test_key_123456789", flushIntervalMs: 60000, onDeliveryError: (error) => received.push(error), debug: true });
      await wrapped.request({ method: "tools/call", params: { name: "private", arguments: { secret: "do-not-log" } } });
      await wrapped.trackmcp.flush();
      assert.equal(received[0].kind, expected);
      assert.equal(received[0].status, status);
      assert.equal(JSON.stringify(received).includes("do-not-log"), false);
    }
    const revoked = [];
    globalThis.fetch = async () => new Response(JSON.stringify({ error: "revoked", api_key: "should-not-appear" }), { status: 401 });
    const revokedClient = withTrackMCP({ async request() { return { ok: true }; } }, { apiKey: "tmcp_diagnostic_test_key_123456789", flushIntervalMs: 60000, onDeliveryError: (error) => revoked.push(error) });
    await revokedClient.request({ method: "tools/call", params: { name: "safe" } });
    await revokedClient.trackmcp.flush();
    assert.equal(revoked[0].kind, "revoked");
    globalThis.fetch = async () => { throw new Error("network secret should not be emitted"); };
    const network = [];
    const wrapped = withTrackMCP({ async request() { return { ok: true }; } }, { apiKey: "tmcp_diagnostic_test_key_123456789", flushIntervalMs: 60000, onDeliveryError: (error) => network.push(error) });
    await wrapped.request({ method: "tools/call", params: { name: "safe" } });
    await wrapped.trackmcp.flush();
    assert.equal(network[0].kind, "network_error");
    assert.equal(network[0].retrying, true);
    assert.equal(warnings.some((warning) => warning.includes("network secret")), false);
  } finally {
    globalThis.fetch = originalFetch;
    console.warn = originalWarn;
  }
});

test("delivery diagnostics are rate-limited without changing the bounded queue", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response("", { status: 401 });
  try {
    const received = [];
    const wrapped = withTrackMCP({ async request() { return { ok: true }; } }, { apiKey: "tmcp_diagnostic_test_key_123456789", flushIntervalMs: 60000, onDeliveryError: (error) => received.push(error) });
    await wrapped.request({ method: "tools/call", params: { name: "one" } });
    await wrapped.trackmcp.flush();
    await wrapped.request({ method: "tools/call", params: { name: "two" } });
    await wrapped.trackmcp.flush();
    assert.equal(received.length, 1);
    assert.equal(wrapped.trackmcp.getDiagnostics().queuedEvents, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("unknown and aborted delivery diagnostics stay bounded and secret-free", async () => {
  const originalFetch = globalThis.fetch;
  try {
    const unknown = [];
    globalThis.fetch = async () => new Response(JSON.stringify({
      error: "unexpected failure",
      email: "user@example.com",
      api_key: "tmcp_secret_should_not_escape",
      next: "https://app.trackmcp.com/private?token=secret",
    }), { status: 418 });
    const unknownClient = withTrackMCP({ async request() { return { ok: true }; } }, {
      apiKey: "tmcp_diagnostic_test_key_123456789",
      flushIntervalMs: 60000,
      onDeliveryError: (error) => unknown.push(error),
    });
    await unknownClient.request({ method: "tools/call", params: { name: "safe", arguments: { password: "not-a-diagnostic" } } });
    await unknownClient.trackmcp.flush();
    assert.deepEqual(unknown[0], { kind: "unknown", status: 418, retrying: false });
    assert.doesNotMatch(JSON.stringify(unknown), /tmcp_secret_should_not_escape|user@example\.com|https:\/\/|password/);

    const aborted = [];
    globalThis.fetch = async () => { const error = new Error("aborted bearer=tmcp_secret"); error.name = "AbortError"; throw error; };
    const abortedClient = withTrackMCP({ async request() { return { ok: true }; } }, {
      apiKey: "tmcp_diagnostic_test_key_123456789",
      flushIntervalMs: 60000,
      onDeliveryError: (error) => aborted.push(error),
    });
    await abortedClient.request({ method: "tools/call", params: { name: "safe" } });
    await abortedClient.trackmcp.flush();
    assert.deepEqual(aborted[0], { kind: "aborted", retrying: true });
    assert.doesNotMatch(JSON.stringify(aborted), /tmcp_secret|bearer|https:\/\//i);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
