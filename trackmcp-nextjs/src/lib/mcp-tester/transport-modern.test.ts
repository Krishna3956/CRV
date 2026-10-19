import assert from "node:assert/strict";
import test from "node:test";
import { sendMcpRequest } from "./transport.ts";
import { normalizeMcpTesterLimits } from "./limits.ts";

const limits = normalizeMcpTesterLimits({ maxTimelineEvents: 32, maxTotalDurationMs: 2_000 });

test("modern transport emits method and bounded name routing headers", async () => {
  let captured: Headers | undefined;
  const result = await sendMcpRequest({
    fetch: async (_input, init) => { captured = new Headers(init?.headers); return new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result: {} }), { status: 200, headers: { "content-type": "application/json" } }); },
    endpoint: new URL("https://example.test/mcp"),
    customHeaders: [],
    protocolVersion: "2026-07-28",
    requestId: 1,
    body: { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "search" } },
    expectsResponse: true,
    limits,
    deadlineMs: performance.now() + 1_000,
    now: () => performance.now(),
    record: () => undefined,
    phase: "modern_discover",
  });
  assert.equal(result.ok, true);
  assert.equal(captured?.get("mcp-protocol-version"), "2026-07-28");
  assert.equal(captured?.get("mcp-method"), "tools/call");
  assert.equal(captured?.get("mcp-name"), "search");
});

test("modern transport does not emit an unbounded or control-character name", async () => {
  let captured: Headers | undefined;
  await sendMcpRequest({
    fetch: async (_input, init) => { captured = new Headers(init?.headers); return new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result: {} }), { status: 200, headers: { "content-type": "application/json" } }); },
    endpoint: new URL("https://example.test/mcp"), customHeaders: [], protocolVersion: "2026-07-28", requestId: 1,
    body: { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "x".repeat(257) + "\n" } }, expectsResponse: true,
    limits, deadlineMs: performance.now() + 1_000, now: () => performance.now(), record: () => undefined, phase: "modern_discover",
  });
  assert.equal(captured?.get("mcp-method"), "tools/call");
  assert.equal(captured?.get("mcp-name"), null);
});
