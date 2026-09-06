import assert from "node:assert/strict";
import test from "node:test";
import {
  REDACTED_VALUE,
  redactHeaders,
  redactText,
  runMcpTester,
  serializeMcpTesterReport,
  validateMcpEndpoint,
  validateMcpHeaders,
} from "./index.ts";
import type { McpFetch } from "./types.ts";

const endpoint = "https://example.com/mcp";

function jsonRpc(result: unknown, id: number, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify({ jsonrpc: "2.0", id, result }), {
    status: 200,
    headers: { "content-type": "application/json", ...headers },
  });
}

function jsonRpcError(code: number, message: string, id = 1): Response {
  return new Response(JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function requestMethod(body: string): string {
  return (JSON.parse(body) as { method: string }).method;
}

function successfulFetch(options: { resources?: boolean; prompts?: boolean; paginated?: boolean } = {}): { fetch: McpFetch; methods: string[] } {
  const methods: string[] = [];
  let toolPage = 0;
  const fetch: McpFetch = async (_input, init) => {
    const body = String(init?.body ?? "{}");
    const method = requestMethod(body);
    methods.push(method);
    if (method === "initialize") {
      return jsonRpc({
        protocolVersion: "2025-06-18",
        serverInfo: { name: "Fixture MCP", version: "1.2.3" },
        capabilities: {
          tools: {},
          ...(options.resources ? { resources: {} } : {}),
          ...(options.prompts ? { prompts: {} } : {}),
        },
      }, 1, { "mcp-session-id": "session-in-memory" });
    }
    if (method === "notifications/initialized") return new Response(null, { status: 202 });
    if (method === "tools/list") {
      toolPage += 1;
      if (options.paginated && toolPage === 1) return jsonRpc({ tools: [{ name: "first", description: "First", inputSchema: { type: "object" } }], nextCursor: "page-2" }, 2);
      return jsonRpc({ tools: [{ name: options.paginated ? "second" : "only", description: "Second", inputSchema: { type: "object" } }] }, options.paginated ? 3 : 2);
    }
    if (method === "resources/list") return jsonRpc({ resources: [{ name: "docs", uri: "https://example.com/docs", description: "Docs" }] }, options.paginated ? 4 : 3);
    if (method === "prompts/list") return jsonRpc({ prompts: [{ name: "summarize", description: "Summarize" }] }, options.paginated ? 5 : 4);
    throw new Error(`unexpected method ${method}`);
  };
  return { fetch, methods };
}

test("valid Streamable HTTP handshake discovers advertised read-only catalogs", async () => {
  const fixture = successfulFetch({ resources: true, prompts: true });
  const report = await runMcpTester({ endpoint, fetch: fixture.fetch });
  assert.equal(report.verdict, "healthy_now");
  assert.deepEqual(fixture.methods, ["initialize", "notifications/initialized", "tools/list", "resources/list", "prompts/list"]);
  assert.equal(report.protocol?.negotiatedVersion, "2025-06-18");
  assert.deepEqual(report.server, { name: "Fixture MCP", version: "1.2.3" });
  assert.equal(report.tools.count, 1);
  assert.equal(report.resources.count, 1);
  assert.equal(report.prompts.count, 1);
  assert.equal(report.healthDimensions.reachability.status, "pass");
  assert.equal(report.healthDimensions.protocol_negotiation.status, "pass");
  assert.equal(report.healthDimensions.capability_discovery.status, "pass");
});

test("unsupported protocol and malformed envelopes are protocol errors", async () => {
  const unsupported = await runMcpTester({
    endpoint,
    fetch: async () => jsonRpc({ protocolVersion: "2099-01-01", serverInfo: { name: "x", version: "1" }, capabilities: {} }, 1),
  });
  assert.equal(unsupported.verdict, "protocol_error");
  assert.ok(unsupported.findings.some((finding) => finding.code === "unsupported_protocol_version"));

  const malformed = await runMcpTester({
    endpoint,
    fetch: async () => new Response("not json", { status: 200, headers: { "content-type": "application/json" } }),
  });
  assert.equal(malformed.verdict, "protocol_error");
  assert.ok(malformed.findings.some((finding) => finding.code === "malformed_json_rpc_envelope"));
});

test("failed initialization and authentication are distinct", async () => {
  const failed = await runMcpTester({ endpoint, fetch: async () => jsonRpcError(-32602, "invalid params") });
  assert.equal(failed.verdict, "protocol_error");

  const auth = await runMcpTester({ endpoint, fetch: async () => new Response("secret-free auth challenge", { status: 401 }) });
  assert.equal(auth.verdict, "auth_required");
  assert.equal(auth.healthDimensions.authentication.status, "fail");
  assert.match(auth.verdictMessage, /not stored/i);
});

test("timeouts and browser/network failures are bounded and not reported as server-down", async () => {
  const timeout = await runMcpTester({
    endpoint,
    limits: { maxTotalDurationMs: 20 },
    fetch: async () => new Promise<Response>(() => undefined),
  });
  assert.equal(timeout.verdict, "incomplete");
  assert.ok(timeout.findings.some((finding) => finding.code === "request_timeout" || finding.code === "total_duration_limit"));

  const blocked = await runMcpTester({ endpoint, fetch: async () => { throw new TypeError("Failed to fetch"); } });
  assert.equal(blocked.verdict, "browser_blocked");
  assert.notEqual(blocked.verdict, "unreachable");
});

test("tools pagination is followed and safely truncated", async () => {
  const fixture = successfulFetch({ paginated: true });
  const report = await runMcpTester({ endpoint, fetch: fixture.fetch });
  assert.equal(report.verdict, "healthy_now");
  assert.equal(report.tools.pages, 2);
  assert.deepEqual(report.tools.items.map((item) => item.name), ["first", "second"]);

  const truncatedFixture = successfulFetch({ paginated: true });
  const truncated = await runMcpTester({ endpoint, fetch: truncatedFixture.fetch, limits: { maxPaginationPages: 1 } });
  assert.equal(truncated.verdict, "incomplete");
  assert.equal(truncated.tools.truncated, true);
  assert.ok(truncated.findings.some((finding) => finding.code === "pagination_limit"));
});

test("resources/list and prompts/list are never requested unless advertised", async () => {
  const fixture = successfulFetch();
  const report = await runMcpTester({ endpoint, fetch: fixture.fetch });
  assert.equal(report.verdict, "healthy_now");
  assert.deepEqual(fixture.methods, ["initialize", "notifications/initialized", "tools/list"]);
  assert.equal(report.resources.pages, 0);
  assert.equal(report.prompts.pages, 0);
});

test("health dimensions keep a reachable quality warning degraded", async () => {
  const fixture = successfulFetch();
  fixture.fetch = async (_input, init) => {
    const body = String(init?.body ?? "{}");
    const method = requestMethod(body);
    fixture.methods.push(method);
    if (method === "initialize") return jsonRpc({ protocolVersion: "2025-06-18", serverInfo: { name: "Fixture MCP", version: "1" }, capabilities: { tools: {} } }, 1);
    if (method === "notifications/initialized") return new Response(null, { status: 202 });
    if (method === "tools/list") return jsonRpc({ tools: [{ name: "underspecified" }] }, 2);
    throw new Error(`unexpected method ${method}`);
  };
  const report = await runMcpTester({ endpoint, fetch: fixture.fetch });
  assert.equal(report.verdict, "degraded");
  assert.equal(report.healthDimensions.reachability.status, "pass");
  assert.equal(report.healthDimensions.protocol_negotiation.status, "pass");
  assert.equal(report.healthDimensions.catalog_quality.status, "warn");
});

test("unsafe targets, unsupported schemes, credential URLs, and redirects are rejected", async () => {
  for (const unsafe of [
    "http://example.com/mcp",
    "file:///tmp/mcp",
    "https://localhost/mcp",
    "https://127.0.0.1/mcp",
    "https://10.0.0.5/mcp",
    "https://[::ffff:7f00:1]/mcp",
    "https://127.0.0.1.nip.io/mcp",
    "https://169.254.169.254/latest/meta-data",
    "https://example.com/mcp?access_token=secret",
  ]) {
    const validation = validateMcpEndpoint(unsafe);
    assert.equal(validation.ok, false, unsafe);
  }

  const redirected = await runMcpTester({
    endpoint,
    fetch: async () => new Response(null, { status: 302, headers: { location: "https://other.example/mcp" } }),
  });
  assert.equal(redirected.verdict, "browser_blocked");
  assert.ok(redirected.findings.some((finding) => finding.code === "browser_request_blocked"));
});

test("header, response, timeline, and JSON rendering limits are enforced", async () => {
  assert.equal(validateMcpHeaders({ Authorization: "Bearer x" }, { maxHeaderValueLength: 20 }).ok, true);
  assert.equal(validateMcpHeaders({ "x-test": "x".repeat(100) }, { maxHeaderValueLength: 20 }).ok, false);
  assert.equal(validateMcpHeaders({ Cookie: "session=secret" }).ok, false);

  const oversized = await runMcpTester({
    endpoint,
    limits: { maxResponseBodyBytes: 50 },
    fetch: async () => new Response(`{"jsonrpc":"2.0","id":1,"result":{"protocolVersion":"2025-06-18","serverInfo":{"name":"${"x".repeat(100)}","version":"1"},"capabilities":{}}}`, { status: 200 }),
  });
  assert.equal(oversized.verdict, "incomplete");
  assert.ok(oversized.findings.some((finding) => finding.code === "response_body_limit"));

  const timeline = await runMcpTester({ endpoint, limits: { maxTimelineEvents: 3 }, fetch: successfulFetch().fetch });
  assert.equal(timeline.timeline.length, 3);
  assert.equal(timeline.timelineTruncated, true);
  assert.ok(timeline.findings.some((finding) => finding.code === "timeline_limit"));

  const serialized = serializeMcpTesterReport(timeline, 500);
  assert.ok(Buffer.byteLength(serialized) <= 500);
  assert.doesNotThrow(() => JSON.parse(serialized));
});

test("credential redaction never returns bearer tokens or sensitive header values", () => {
  assert.equal(redactText("Authorization: Bearer top-secret"), "Authorization: [redacted]");
  assert.equal(redactHeaders({ Authorization: "Bearer top-secret", "x-public": "keep" }).Authorization, REDACTED_VALUE);
  assert.equal(redactHeaders({ Authorization: "Bearer top-secret", "x-public": "keep" })["x-public"], "keep");
});

test("default flow executes no tools, reads, or prompts", async () => {
  const fixture = successfulFetch({ resources: true, prompts: true });
  const report = await runMcpTester({ endpoint, headers: { Authorization: "Bearer one-time" }, fetch: fixture.fetch });
  assert.equal(report.verdict, "healthy_now");
  assert.ok(fixture.methods.every((method) => method === "initialize" || method === "notifications/initialized" || method.endsWith("/list")));
  assert.ok(!fixture.methods.some((method) => method === "tools/call" || method === "resources/read" || method === "prompts/get"));
  assert.doesNotMatch(JSON.stringify(report), /Bearer one-time|authorization:\s*Bearer/i);
});
