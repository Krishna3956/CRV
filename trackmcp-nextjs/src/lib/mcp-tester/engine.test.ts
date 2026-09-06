import assert from "node:assert/strict";
import { after, test } from "node:test";
import {
  REDACTED_VALUE,
  HARD_MCP_TESTER_LIMITS,
  isMcpBrowserRuntime,
  redactHeaders,
  redactText,
  runMcpTester,
  safeResourceUri,
  serializeMcpTesterReport,
  validateMcpEndpoint,
  validateMcpHeaders,
} from "./index.ts";
import type { McpFetch } from "./types.ts";

const endpoint = "https://example.com/mcp";
const nodeRuntimeObserved = isMcpBrowserRuntime();
const browserShimDescriptors = new Map<string, PropertyDescriptor | undefined>([
  ["window", Object.getOwnPropertyDescriptor(globalThis, "window")],
  ["document", Object.getOwnPropertyDescriptor(globalThis, "document")],
  ["self", Object.getOwnPropertyDescriptor(globalThis, "self")],
  ["location", Object.getOwnPropertyDescriptor(globalThis, "location")],
  ["EdgeRuntime", Object.getOwnPropertyDescriptor(globalThis, "EdgeRuntime")],
]);

Object.defineProperty(globalThis, "window", { configurable: true, value: { location: { href: "https://tester.invalid/" } } });
Object.defineProperty(globalThis, "document", { configurable: true, value: {} });

after(() => {
  for (const [name, descriptor] of browserShimDescriptors) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else Reflect.deleteProperty(globalThis, name);
  }
});

async function withoutBrowserRuntime<T>(callback: () => Promise<T>): Promise<T> {
  const current = new Map<string, PropertyDescriptor | undefined>([
    ["window", Object.getOwnPropertyDescriptor(globalThis, "window")],
    ["document", Object.getOwnPropertyDescriptor(globalThis, "document")],
    ["self", Object.getOwnPropertyDescriptor(globalThis, "self")],
    ["location", Object.getOwnPropertyDescriptor(globalThis, "location")],
    ["EdgeRuntime", Object.getOwnPropertyDescriptor(globalThis, "EdgeRuntime")],
  ]);
  try {
    for (const name of current.keys()) Reflect.deleteProperty(globalThis, name);
    return await callback();
  } finally {
    for (const [name, descriptor] of current) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else Reflect.deleteProperty(globalThis, name);
    }
  }
}

function withEdgeRuntime<T>(callback: () => Promise<T>): Promise<T> {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "EdgeRuntime");
  Object.defineProperty(globalThis, "EdgeRuntime", { configurable: true, value: "v1" });
  return callback().finally(() => {
    if (descriptor) Object.defineProperty(globalThis, "EdgeRuntime", descriptor);
    else Reflect.deleteProperty(globalThis, "EdgeRuntime");
  });
}

function stalledResponse(options: { firstChunk?: string; contentType?: string; onCancel?: () => void } = {}): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      if (options.firstChunk) controller.enqueue(encoder.encode(options.firstChunk));
    },
    cancel() {
      options.onCancel?.();
    },
  });
  return new Response(stream, { status: 200, headers: { "content-type": options.contentType ?? "application/json" } });
}

function responseWithoutBody(headers: Record<string, string>, onText: () => void): Response {
  return {
    body: undefined,
    headers: new Headers(headers),
    ok: true,
    redirected: false,
    status: 200,
    statusText: "OK",
    type: "basic",
    url: endpoint,
    text: async () => {
      onText();
      return "should not be read";
    },
  } as unknown as Response;
}

function waitFor(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
  const requestOptions: RequestInit[] = [];
  const locationBefore = (globalThis as typeof globalThis & { window: { location: { href: string } } }).window.location.href;
  const report = await runMcpTester({
    endpoint,
    fetch: async (input, init) => {
      requestOptions.push(init ?? {});
      return fixture.fetch(input, init);
    },
  });
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
  assert.ok(requestOptions.every((init) => init.redirect === "manual"));
  assert.ok(requestOptions.every((init) => init.credentials === "omit"));
  assert.ok(requestOptions.every((init) => init.mode === "cors"));
  assert.ok(requestOptions.every((init) => init.cache === "no-store"));
  assert.ok(requestOptions.every((init) => init.signal instanceof AbortSignal));
  assert.equal((globalThis as typeof globalThis & { window: { location: { href: string } } }).window.location.href, locationBefore);
});

test("browser runtime guard rejects Node and Edge and never invokes injected fetch", async () => {
  assert.equal(nodeRuntimeObserved, false);
  let calls = 0;
  const fetch: McpFetch = async () => {
    calls += 1;
    return jsonRpc({}, 1);
  };
  const nodeReport = await withoutBrowserRuntime(() => runMcpTester({ endpoint, fetch }));
  assert.equal(nodeReport.verdict, "unsupported");
  assert.ok(nodeReport.findings.some((finding) => finding.code === "browser_runtime_required"));
  assert.equal(calls, 0);

  const edgeReport = await withEdgeRuntime(() => runMcpTester({ endpoint, fetch }));
  assert.equal(edgeReport.verdict, "unsupported");
  assert.equal(calls, 0);
  assert.equal(isMcpBrowserRuntime(), true);
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

  const unmatched = await runMcpTester({
    endpoint,
    fetch: async () => jsonRpc({ protocolVersion: "2025-06-18", serverInfo: { name: "x", version: "1" }, capabilities: {} }, 99),
  });
  assert.equal(unmatched.verdict, "protocol_error");

  const duplicate = await runMcpTester({
    endpoint,
    fetch: async () => new Response([
      `data: ${JSON.stringify({ jsonrpc: "2.0", id: 1, result: { protocolVersion: "2025-06-18", serverInfo: { name: "x", version: "1" }, capabilities: {} } })}`,
      "",
      `data: ${JSON.stringify({ jsonrpc: "2.0", id: 1, result: { protocolVersion: "2025-06-18", serverInfo: { name: "x", version: "1" }, capabilities: {} } })}`,
      "",
    ].join("\n"), { status: 200, headers: { "content-type": "text/event-stream" } }),
  });
  assert.equal(duplicate.verdict, "protocol_error");
  assert.ok(duplicate.findings.some((finding) => finding.code === "duplicate_json_rpc_id"));

  const multipleSse = successfulFetch();
  const originalMultipleFetch = multipleSse.fetch;
  multipleSse.fetch = async (input, init) => {
    const method = requestMethod(String(init?.body ?? "{}"));
    if (method === "initialize") {
      return new Response([
        `data: ${JSON.stringify({ jsonrpc: "2.0", id: 99, result: { protocolVersion: "2025-06-18", serverInfo: { name: "ignored", version: "1" }, capabilities: {} } })}`,
        "",
        `data: ${JSON.stringify({ jsonrpc: "2.0", id: 1, result: { protocolVersion: "2025-06-18", serverInfo: { name: "Fixture MCP", version: "1" }, capabilities: { tools: {} } } })}`,
        "",
      ].join("\n"), { status: 200, headers: { "content-type": "text/event-stream" } });
    }
    return originalMultipleFetch(input, init);
  };
  const multipleReport = await runMcpTester({ endpoint, fetch: multipleSse.fetch });
  assert.equal(multipleReport.verdict, "healthy_now");

  let nested: Record<string, unknown> = {};
  for (let index = 0; index < 25; index += 1) nested = { nested };
  const deeplyNested = await runMcpTester({
    endpoint,
    fetch: async () => jsonRpc({ protocolVersion: "2025-06-18", serverInfo: { name: "x", version: "1" }, capabilities: {}, nested }, 1),
  });
  assert.equal(deeplyNested.verdict, "protocol_error");

  const excessiveNodes = await runMcpTester({
    endpoint,
    fetch: async () => jsonRpc({ protocolVersion: "2025-06-18", serverInfo: { name: "x", version: "1" }, capabilities: {}, nodes: Array.from({ length: 6_000 }, () => "x") }, 1),
  });
  assert.equal(excessiveNodes.verdict, "protocol_error");
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

  const serverFailure = await runMcpTester({ endpoint, fetch: async () => new Response("server failure", { status: 503 }) });
  assert.equal(serverFailure.verdict, "unreachable");
});

test("pre-aborted signals never invoke fetch and abort during fetch stops the operation", async () => {
  const preAborted = new AbortController();
  preAborted.abort();
  let preAbortCalls = 0;
  const preAbortReport = await runMcpTester({
    endpoint,
    signal: preAborted.signal,
    fetch: async () => {
      preAbortCalls += 1;
      return jsonRpc({}, 1);
    },
  });
  assert.equal(preAbortCalls, 0);
  assert.equal(preAbortReport.verdict, "incomplete");
  assert.ok(preAbortReport.findings.some((finding) => finding.code === "request_aborted"));

  const controller = new AbortController();
  let fetchStarted = false;
  let releaseFetch: ((response: Response) => void) | undefined;
  const duringFetch = await runMcpTester({
    endpoint,
    signal: controller.signal,
    fetch: async (_input, init) => {
      fetchStarted = true;
      setTimeout(() => controller.abort(), 5);
      return new Promise<Response>((resolve) => {
        releaseFetch = resolve;
        assert.equal(init?.signal?.aborted, false);
      });
    },
  });
  assert.equal(fetchStarted, true);
  assert.equal(duringFetch.verdict, "incomplete");
  assert.ok(duringFetch.findings.some((finding) => finding.code === "request_aborted"));
  assert.equal(duringFetch.timeline.some((event) => event.kind === "response_received"), false);
  const timelineBeforeLateFetchResolution = JSON.stringify(duringFetch.timeline);
  releaseFetch?.(jsonRpc({}, 1));
  await waitFor(0);
  assert.equal(JSON.stringify(duringFetch.timeline), timelineBeforeLateFetchResolution);

  const cleanupController = new AbortController();
  let listenerCount = 0;
  const cleanupSignal = cleanupController.signal as AbortSignal & {
    addEventListener: AbortSignal["addEventListener"];
    removeEventListener: AbortSignal["removeEventListener"];
  };
  const originalAdd = cleanupSignal.addEventListener.bind(cleanupSignal);
  const originalRemove = cleanupSignal.removeEventListener.bind(cleanupSignal);
  cleanupSignal.addEventListener = ((type: "abort", listener: (this: AbortSignal, event: Event) => unknown, options?: boolean | AddEventListenerOptions) => {
    listenerCount += 1;
    return originalAdd(type, listener, options);
  }) as typeof cleanupSignal.addEventListener;
  cleanupSignal.removeEventListener = ((type: "abort", listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions) => {
    listenerCount -= 1;
    return originalRemove(type, listener, options);
  }) as typeof cleanupSignal.removeEventListener;
  const cleanupReport = await runMcpTester({ endpoint, signal: cleanupSignal, limits: { maxTotalDurationMs: 10 }, fetch: successfulFetch().fetch });
  const cleanupSnapshot = JSON.stringify(cleanupReport);
  assert.equal(listenerCount, 0);
  await waitFor(25);
  assert.equal(listenerCount, 0);
  assert.equal(JSON.stringify(cleanupReport), cleanupSnapshot);
});

test("abort during body reading cancels the reader and a stalled body is covered by the total deadline", async () => {
  const external = new AbortController();
  let externallyCancelled = false;
  const abortedBody = await runMcpTester({
    endpoint,
    signal: external.signal,
    fetch: async () => {
      setTimeout(() => external.abort(), 5);
      return stalledResponse({ onCancel: () => { externallyCancelled = true; } });
    },
  });
  assert.equal(abortedBody.verdict, "incomplete");
  assert.equal(externallyCancelled, true);
  const abortedBodySnapshot = JSON.stringify(abortedBody);
  await waitFor(0);
  assert.equal(JSON.stringify(abortedBody), abortedBodySnapshot);

  let deadlineCancelled = false;
  const deadlineBody = await runMcpTester({
    endpoint,
    limits: { maxTotalDurationMs: 20 },
    fetch: async () => stalledResponse({ onCancel: () => { deadlineCancelled = true; } }),
  });
  assert.equal(deadlineBody.verdict, "incomplete");
  assert.equal(deadlineCancelled, true);
  assert.ok(deadlineBody.findings.some((finding) => finding.code === "request_timeout"));
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
    "https://2130706433/mcp",
    "https://0x7f000001/mcp",
    "https://0177.0.0.1/mcp",
    "https://169.254.169.254/latest/meta-data",
    "https://metadata.google.internal/computeMetadata/v1",
    "https://user:pass@example.com/mcp",
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
  for (const control of ["\r", "\n", "\u0000", "\u0001", "\u000b", "\u007f", "\u001f"]) {
    assert.equal(validateMcpHeaders({ "x-test": `safe${control}value` }).ok, false, `value ${JSON.stringify(control)}`);
    assert.equal(validateMcpHeaders({ [`x-${control}name`]: "safe" }).ok, false, `name ${JSON.stringify(control)}`);
  }

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

test("oversized non-streaming bodies do not call text and streaming overflow cancels", async () => {
  let textCalled = false;
  const noBody = await runMcpTester({
    endpoint,
    limits: { maxResponseBodyBytes: 10 },
    fetch: async () => responseWithoutBody({ "content-length": "100" }, () => { textCalled = true; }),
  });
  assert.equal(noBody.verdict, "incomplete");
  assert.equal(textCalled, false);

  let contentLengthCancelled = false;
  const oversizedStream = new ReadableStream<Uint8Array>({
    cancel() {
      contentLengthCancelled = true;
    },
  });
  const contentLengthReport = await runMcpTester({
    endpoint,
    limits: { maxResponseBodyBytes: 10 },
    fetch: async () => new Response(oversizedStream, { status: 200, headers: { "content-length": "100" } }),
  });
  assert.equal(contentLengthReport.verdict, "incomplete");
  assert.equal(contentLengthCancelled, true);

  let cancelled = false;
  const overflow = await runMcpTester({
    endpoint,
    limits: { maxResponseBodyBytes: 10 },
    fetch: async () => stalledResponse({ firstChunk: "x".repeat(100), onCancel: () => { cancelled = true; } }),
  });
  assert.equal(overflow.verdict, "incomplete");
  assert.equal(cancelled, true);

  let sseCancelled = false;
  const oversizedSse = await runMcpTester({
    endpoint,
    limits: { maxResponseBodyBytes: 10 },
    fetch: async () => stalledResponse({ firstChunk: `data: ${"x".repeat(100)}\n\n`, contentType: "text/event-stream", onCancel: () => { sseCancelled = true; } }),
  });
  assert.equal(oversizedSse.verdict, "incomplete");
  assert.equal(sseCancelled, true);
});

test("credential redaction never returns bearer tokens or sensitive header values", () => {
  assert.equal(redactText("Authorization: Bearer top-secret"), "Authorization: [redacted]");
  assert.equal(redactHeaders({ Authorization: "Bearer top-secret", "x-public": "keep" }).Authorization, REDACTED_VALUE);
  assert.equal(redactHeaders({ Authorization: "Bearer top-secret", "x-public": "keep" })["x-public"], "keep");
  const privateKey = "-----BEGIN PRIVATE KEY-----\nprivate-material\n-----END PRIVATE KEY-----";
  const redacted = redactText([
    "api_key=api-secret",
    "Cookie: session=cookie-secret",
    "Authorization: Basic basic-secret",
    "jwt=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.signature",
    privateKey,
    "https://user:password@example.com/resource?token=query-secret",
  ].join(" "));
  for (const secret of ["api-secret", "cookie-secret", "basic-secret", "signature", "query-secret", "private-material", "user:password"]) {
    assert.equal(redacted.includes(secret), false, secret);
  }
  assert.equal(safeResourceUri("custom://user:password@example.com/resource?api_key=query-secret"), "custom://example.com/resource");

  const encodedQuerySecrets = redactText([
    "https://example.com/mcp?access%5Ftoken=encoded-secret",
    "https://example.com/mcp?ACCESS%255FTOKEN=double-encoded-secret",
    "https://example.com/mcp?API%2DKEY=api-key-secret",
    "https://example.com/mcp?ToKeN=encoded%2Dvalue",
    "https://example.com/mcp?secret=secret%2Fvalue",
    "https://example.com/mcp?password=password%3Dvalue",
    "https://example.com/mcp?authorization=authorization%2Dvalue",
    "https://example.com/mcp?%E0%A4%A=malformed-query-value",
  ].join(" "));
  for (const secret of ["encoded-secret", "double-encoded-secret", "api-key-secret", "encoded%2Dvalue", "secret%2Fvalue", "password%3Dvalue", "authorization%2Dvalue", "malformed-query-value"]) {
    assert.equal(encodedQuerySecrets.includes(secret), false, secret);
  }
});

test("serialized reports redact secrets in reports, findings, timelines, and rendered strings", async () => {
  const fixture = successfulFetch({ resources: true, prompts: true });
  fixture.fetch = async (_input, init) => {
    const method = requestMethod(String(init?.body ?? "{}"));
    if (method === "initialize") return jsonRpc({
      protocolVersion: "2025-06-18",
      serverInfo: { name: "<script>Bearer server-secret</script>", version: "1" },
      capabilities: { tools: {}, resources: {}, prompts: {} },
    }, 1);
    if (method === "notifications/initialized") return new Response(null, { status: 202 });
    if (method === "tools/list") return jsonRpc({ tools: [{ name: "safe", description: "api_key=tool-secret <img>" }] }, 2);
    if (method === "resources/list") return jsonRpc({ resources: [{ name: "resource", uri: "custom://user:pass@example.com/path?token=resource-secret", description: "Cookie: resource-cookie" }] }, 3);
    if (method === "prompts/list") return jsonRpc({ prompts: [{ name: "prompt", description: "-----BEGIN PRIVATE KEY-----\nprompt-key\n-----END PRIVATE KEY-----" }] }, 4);
    throw new Error(`unexpected method ${method}`);
  };
  const report = await runMcpTester({ endpoint, headers: { Authorization: "Bearer request-secret" }, fetch: fixture.fetch });
  const serialized = serializeMcpTesterReport(report);
  for (const secret of ["server-secret", "tool-secret", "resource-secret", "resource-cookie", "prompt-key", "request-secret", "user:pass"]) {
    assert.equal(serialized.includes(secret), false, secret);
    assert.equal(JSON.stringify(report.findings).includes(secret), false, `finding ${secret}`);
    assert.equal(JSON.stringify(report.timeline).includes(secret), false, `timeline ${secret}`);
  }
  assert.equal(serialized.includes("<script>"), false);
  assert.equal(serialized.includes("\\u003cscript\\u003e"), true);
});

test("serialized reports clamp caller limits and never exceed the hard ceiling", async () => {
  const fixture = successfulFetch();
  const report = await runMcpTester({ endpoint, fetch: fixture.fetch });
  const oversizedReport = {
    ...report,
    limitations: Array.from({ length: 10_000 }, () => "remote limitation ".repeat(100)),
  };
  const serialized = serializeMcpTesterReport(oversizedReport, Number.MAX_SAFE_INTEGER);
  assert.ok(Buffer.byteLength(serialized) <= HARD_MCP_TESTER_LIMITS.maxRenderedJsonBytes);
  assert.doesNotThrow(() => JSON.parse(serialized));
  const serializedAtCeiling = serializeMcpTesterReport(oversizedReport, HARD_MCP_TESTER_LIMITS.maxRenderedJsonBytes + 1);
  assert.ok(Buffer.byteLength(serializedAtCeiling) <= HARD_MCP_TESTER_LIMITS.maxRenderedJsonBytes);
});

test("expired synchronous parsing work is incomplete and never reported as healthy", async () => {
  const report = await runMcpTester({
    endpoint,
    limits: { maxTotalDurationMs: 1, maxResponseBodyBytes: 2_000_000 },
    fetch: async () => jsonRpc({
      protocolVersion: "2025-06-18",
      serverInfo: { name: "x".repeat(800_000), version: "1" },
      capabilities: {},
    }, 1),
  });
  assert.equal(report.verdict, "incomplete");
  assert.notEqual(report.verdict, "healthy_now");
  assert.ok(report.findings.some((finding) => finding.code === "request_timeout" || finding.code === "total_duration_limit"));
  assert.equal(report.phases.at(-1)?.outcome, "incomplete");
  const serialized = serializeMcpTesterReport(report, Number.MAX_SAFE_INTEGER);
  assert.ok(Buffer.byteLength(serialized) <= HARD_MCP_TESTER_LIMITS.maxRenderedJsonBytes);
});

test("default flow executes no tools, reads, or prompts", async () => {
  const fixture = successfulFetch({ resources: true, prompts: true });
  const report = await runMcpTester({ endpoint, headers: { Authorization: "Bearer one-time" }, fetch: fixture.fetch });
  assert.equal(report.verdict, "healthy_now");
  assert.ok(fixture.methods.every((method) => method === "initialize" || method === "notifications/initialized" || method.endsWith("/list")));
  assert.ok(!fixture.methods.some((method) => method === "tools/call" || method === "resources/read" || method === "prompts/get"));
  assert.deepEqual(fixture.methods, ["initialize", "notifications/initialized", "tools/list", "resources/list", "prompts/list"]);
  assert.doesNotMatch(JSON.stringify(report), /Bearer one-time|authorization:\s*Bearer/i);
});
