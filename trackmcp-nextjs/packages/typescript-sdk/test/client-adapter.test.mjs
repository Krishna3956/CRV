import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import http from "node:http";
import { join } from "node:path";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { TrackMCPClientAdapter, protocolResponseMetadata } from "../dist/client-adapter.js";
import { TrackMCPClient } from "../dist/index.js";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const REPEAT_WINDOW_MS = 5 * 60 * 1000;

test("protocol family metadata classifies bounded modern MCP methods", () => {
  assert.equal(protocolResponseMetadata("sampling/createMessage", { resultType: "input_required" }).protocol_family, "sampling");
  assert.equal(protocolResponseMetadata("elicitation/create", { resultType: "complete" }).protocol_family, "elicitation");
  assert.equal(protocolResponseMetadata("completion/complete", {}).protocol_family, "completion");
  assert.equal(protocolResponseMetadata("tasks/get", { status: "working" }).protocol_family, "tasks");
  assert.equal(protocolResponseMetadata("resources/list", {}).protocol_family, "resources");
  assert.equal(protocolResponseMetadata("prompts/list", {}).protocol_family, "prompts");
  assert.equal(protocolResponseMetadata("tools/list", {}).protocol_family, "tools");
  assert.equal(protocolResponseMetadata("subscriptions/listen", {}).protocol_family, "subscriptions");
  assert.equal(protocolResponseMetadata("notifications/resources/updated", {}).protocol_family, "notifications");
  assert.equal(protocolResponseMetadata("private/method", {}).protocol_family, undefined);
});

test("pins the MCP dependency and exposes the adapter only through the Node export condition", async () => {
  const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  assert.equal(packageJson.peerDependencies["@modelcontextprotocol/sdk"], "1.32.1");
  assert.equal(packageJson.devDependencies["@modelcontextprotocol/sdk"], "1.32.1");
  assert.equal(packageJson.exports["./client-adapter"].node, "./dist/client-adapter.js");
  assert.equal(packageJson.exports["./client-adapter"].browser, undefined);
  assert.equal(packageJson.exports["./client-adapter"].default, null);
});

test("frontend Next.js build cannot include the Node-only adapter", async () => {
  const packageDir = new URL("..", import.meta.url).pathname;
  const tempDir = await mkdtemp(join("/tmp", "trackmcp-browser-bundle-"));
  const nodeModules = join(tempDir, "node_modules");
  const scopedModules = join(nodeModules, "@trackmcp");
  const appDir = join(tempDir, "app");
  const require = createRequire(import.meta.url);
  await mkdir(scopedModules, { recursive: true });
  await mkdir(appDir, { recursive: true });
  await symlink(packageDir, join(scopedModules, "sdk"), "dir");
  for (const dependency of ["next", "react", "react-dom"]) {
    await symlink(require.resolve(dependency + "/package.json").replace(/\/package\.json$/, ""), join(nodeModules, dependency), "dir");
  }
  await writeFile(join(tempDir, "package.json"), JSON.stringify({ name: "browser-adapter-fixture", private: true }));
  await writeFile(join(appDir, "layout.js"), "export default function Layout({ children }) { return <html><body>{children}</body></html>; }");
  await writeFile(join(appDir, "page.js"), "\"use client\"; import { TrackMCPClientAdapter } from \"@trackmcp/sdk/client-adapter\"; export default function Page() { return <div>{String(TrackMCPClientAdapter)}</div>; }");
  try {
    const nextBin = require.resolve("next/dist/bin/next");
    const result = spawnSync(process.execPath, [nextBin, "build"], {
      cwd: tempDir,
      encoding: "utf8",
      timeout: 180_000,
      killSignal: "SIGTERM",
    });
    assert.equal(result.error, undefined, result.error?.message);
    assert.notEqual(result.status, 0);
    assert.match(result.stdout + "\n" + result.stderr, /client-adapter|export|browser|resolve|Node\.js/i);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("accepts the selected official SSE transport and rejects mismatches", () => {
  const adapter = new TrackMCPClientAdapter({ apiKey: "tmcp_test", service: "adapter-test", transport: "stdio" });
  assert.throws(() => adapter.wrapTransport(new SSEClientTransport(new URL("https://example.test/mcp"))), /selected official/);
  const sseAdapter = new TrackMCPClientAdapter({ apiKey: "tmcp_test", service: "adapter-test", transport: "sse" });
  const raw = new SSEClientTransport(new URL("https://example.test/mcp"));
  assert.equal(sseAdapter.wrapTransport(raw), sseAdapter.wrapTransport(raw));
});

test("rejects the Edge runtime marker before opening a capture path", () => {
  globalThis.EdgeRuntime = "edge";
  try {
    assert.throws(() => new TrackMCPClientAdapter({ apiKey: "tmcp_test", service: "adapter-test", transport: "stdio" }), /Node.js runtime/);
  } finally {
    delete globalThis.EdgeRuntime;
  }
});

test("reserved client metadata cannot be replaced by a caller payload", () => {
  let captured;
  const client = new TrackMCPClient({ apiKey: "tmcp_test", service: "adapter-test", payloadMode: "metadata", flushIntervalMs: 60000 });
  client.captureClient({
    event_type: "custom",
    started_at: new Date().toISOString(),
    payload: { _trackmcp: { observation_kind: "not-a-client-kind", observation_source: "server", raw: "secret" } },
  }, (event) => { captured = event; });
  assert.equal(captured.payload._trackmcp.observation_source, "client");
  assert.equal(captured.payload._trackmcp.observation_kind, undefined);
  assert.equal(captured.payload._trackmcp.raw, undefined);
});

async function listen(server) {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return `http://127.0.0.1:${server.address().port}`;
}

async function closeServer(server) {
  await new Promise((resolve) => server.close(resolve));
}

test("uses MCP SDK 1.32.1 with a real StdioClientTransport and captures protocol identity", async () => {
  const received = [];
  const ingest = http.createServer((request, response) => {
    let body = "";
    request.on("data", (chunk) => { body += chunk; });
    request.on("end", () => {
      received.push(JSON.parse(body));
      response.writeHead(200, { "content-type": "application/json" });
      response.end("{}");
    });
  });
  const endpoint = await listen(ingest);
  const child = `
    let buffer = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      buffer += chunk;
      let newline;
      while ((newline = buffer.indexOf("\\n")) >= 0) {
        const message = JSON.parse(buffer.slice(0, newline));
        buffer = buffer.slice(newline + 1);
        let result = {};
        if (message.method === "initialize") result = { protocolVersion: "2025-06-18", capabilities: { tools: {}, resources: { subscribe: true }, "private capability": {} }, serverInfo: { name: "stdio-fixture", version: "1" }, sessionId: "stdio-protocol-session" };
        if (message.method === "tools/call") result = { content: [{ type: "text", text: "ok" }] };
        process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id: message.id, result }) + "\\n");
      }
    });
  `;
  const raw = new StdioClientTransport({ command: process.execPath, args: ["-e", child], stderr: "ignore" });
  const events = [];
  const adapter = new TrackMCPClientAdapter({ apiKey: "tmcp_test", service: "adapter-test", endpoint, transport: "stdio", flushIntervalMs: 60000, onEvent: (event) => events.push(event) });
  const client = new Client({ name: "stdio-client", version: "1.2.3" });
  await client.connect(adapter.wrapTransport(raw));
  await client.callTool({ name: "lookup", arguments: { password: "must-not-be-captured", prompt: "private prompt", completion: "private completion", query: "mcp" } });
  await client.close();
  await adapter.flush();
  await wait(30);
  await closeServer(ingest);

  const all = received.flatMap((batch) => batch.events);
  const issued = all.find((event) => event.payload?._trackmcp?.observation_kind === "tool_call_issued");
  const result = all.find((event) => event.payload?._trackmcp?.observation_kind === "result_received");
  const initialize = events.find((event) => event.mcp_method === "initialize" && event.direction === "server_to_client");
  assert.ok(issued);
  assert.ok(result);
  assert.ok(initialize);
  assert.deepEqual(protocolResponseMetadata("initialize", { capabilities: { tools: {}, resources: {}, "private capability": {} } }), { capability_names: "resources,tools" });
  assert.equal(issued.observation_source, "client");
  assert.equal(result.observation_source, "client");
  assert.equal(issued.client_name, "stdio-client");
  assert.equal(issued.client_version, "1.2.3");
  assert.equal(issued.session_id, "stdio-protocol-session");
  assert.equal(issued.session_id_source, "protocol");
  assert.equal(issued.payload_policy, "metadata");
  assert.equal(JSON.stringify(all).includes("must-not-be-captured"), false);
  assert.equal(JSON.stringify(all).includes("private prompt"), false);
  assert.equal(JSON.stringify(all).includes("private completion"), false);
  assert.equal(events.some((event) => event.payload?._trackmcp?.observation_kind === "session_started"), true);
  assert.equal(events.filter((event) => event.payload?._trackmcp?.observation_kind === "session_ended").length, 1);
});

test("real Stdio child exit emits bounded transport failure evidence", async () => {
  const events = [];
  const child = `process.stdin.resume(); setTimeout(() => process.exit(1), 40);`;
  const raw = new StdioClientTransport({ command: process.execPath, args: ["-e", child], stderr: "ignore" });
  const adapter = new TrackMCPClientAdapter({ apiKey: "tmcp_test", service: "adapter-test", transport: "stdio", flushIntervalMs: 60000, onEvent: (event) => events.push(event) });
  const wrapped = adapter.wrapTransport(raw);
  wrapped.onerror = () => {};
  wrapped.onclose = () => {};
  await wrapped.start();
  await wrapped.send(toolCall("process-exit", "lookup"));
  await new Promise((resolve) => setTimeout(resolve, 160));
  const failure = events.find((event) => event.event_type === "session" && event.error_class === "transport_error");
  assert.ok(failure);
  assert.equal(failure.success, false);
  assert.equal(failure.is_error, true);
  assert.equal(failure.payload_policy, "metadata");
  assert.equal(JSON.stringify(events).includes("process.exit"), false);
  await wrapped.close().catch(() => {});
});

test("uses a real StreamableHTTPClientTransport and preserves transport-generated sessions", async () => {
  const requests = [];
  const server = http.createServer((request, response) => {
    if (request.method === "GET") {
      response.writeHead(405);
      response.end();
      return;
    }
    let body = "";
    request.on("data", (chunk) => { body += chunk; });
    request.on("end", () => {
      const message = JSON.parse(body);
      requests.push(message);
      const result = message.method === "initialize"
        ? { protocolVersion: "2025-06-18", capabilities: {}, serverInfo: { name: "http-fixture", version: "1" } }
        : { content: [{ type: "text", text: "ok" }] };
      response.writeHead(200, { "content-type": "application/json", "mcp-session-id": "http-transport-session" });
      response.end(JSON.stringify({ jsonrpc: "2.0", id: message.id, result }));
    });
  });
  const endpoint = await listen(server);
  const events = [];
  const adapter = new TrackMCPClientAdapter({ apiKey: "tmcp_test", service: "adapter-test", endpoint: "http://127.0.0.1:1", transport: "streamable_http", flushIntervalMs: 60000, onEvent: (event) => events.push(event) });
  const client = new Client({ name: "http-client", version: "2.0.0" });
  const raw = new StreamableHTTPClientTransport(new URL(endpoint));
  await client.connect(adapter.wrapTransport(raw));
  await client.callTool({ name: "lookup", arguments: {} });
  await client.close();
  await closeServer(server);

  assert.equal(requests.some((message) => message.method === "initialize"), true);
  const issued = events.find((event) => event.payload?._trackmcp?.observation_kind === "tool_call_issued");
  const result = events.find((event) => event.payload?._trackmcp?.observation_kind === "result_received");
  assert.ok(issued);
  assert.ok(result);
  assert.equal(issued.transport, "streamable_http");
  assert.equal(issued.session_id, "http-transport-session");
  assert.equal(issued.session_id_source, "transport_generated");
});

test("real Streamable HTTP task lifecycle keeps handles hashed", async () => {
  const requests = [];
  const server = http.createServer((request, response) => {
    let body = "";
    request.on("data", (chunk) => { body += chunk; });
    request.on("end", () => {
      const message = JSON.parse(body);
      requests.push(message);
      const result = message.method === "tools/call"
        ? { resultType: "task", taskId: "secret-task", status: "working" }
        : message.method === "tasks/get" && message.id === "get-task"
          ? { taskId: "secret-task", status: "working" }
          : message.method === "tasks/update"
            ? { taskId: "secret-task", status: "input_required" }
            : message.method === "tasks/get"
              ? { taskId: "secret-task", status: "cancelled" }
              : {};
      response.writeHead(200, { "content-type": "application/json", "mcp-session-id": "task-http-session" });
      response.end(JSON.stringify({ jsonrpc: "2.0", id: message.id, result }));
    });
  });
  const endpoint = await listen(server);
  const events = [];
  const adapter = new TrackMCPClientAdapter({ apiKey: "tmcp_test", service: "adapter-test", transport: "streamable_http", flushIntervalMs: 60000, onEvent: (event) => events.push(event) });
  const raw = new StreamableHTTPClientTransport(new URL(endpoint));
  const wrapped = adapter.wrapTransport(raw);
  wrapped.onmessage = () => {};
  wrapped.onerror = () => {};
  try {
    await wrapped.start();
    await wrapped.send(toolCall("create-task", "long_running"));
    await wrapped.send({ jsonrpc: "2.0", id: "get-task", method: "tasks/get", params: { taskId: "secret-task" } });
    await wrapped.send({ jsonrpc: "2.0", id: "update-task", method: "tasks/update", params: { taskId: "secret-task", input: { private: "value" } } });
    await wrapped.send({ jsonrpc: "2.0", id: "cancel-task", method: "tasks/cancel", params: { taskId: "secret-task" } });
    await wrapped.send({ jsonrpc: "2.0", id: "final-task", method: "tasks/get", params: { taskId: "secret-task" } });
    const lifecycle = events.filter((event) => event.task_id);
    assert.equal(lifecycle.length, 4);
    assert.deepEqual(lifecycle.map((event) => event.task_status), ["working", "working", "input_required", "cancelled"]);
    assert.equal(new Set(lifecycle.map((event) => event.task_id)).size, 1);
    assert.deepEqual(requests.map((message) => message.method), ["tools/call", "tasks/get", "tasks/update", "tasks/cancel", "tasks/get"]);
    assert.equal(JSON.stringify(events).includes("secret-task"), false);
    assert.equal(JSON.stringify(events).includes("private"), false);
  } finally {
    await wrapped.close().catch(() => {});
    await closeServer(server);
  }
});

test("real Streamable HTTP server disconnect emits bounded transport failure evidence", async () => {
  const server = http.createServer((request) => { request.socket.destroy(); });
  const endpoint = await listen(server);
  const events = [];
  const adapter = new TrackMCPClientAdapter({ apiKey: "tmcp_test", service: "adapter-test", transport: "streamable_http", flushIntervalMs: 60000, onEvent: (event) => events.push(event) });
  const raw = new StreamableHTTPClientTransport(new URL(endpoint));
  const wrapped = adapter.wrapTransport(raw);
  wrapped.onerror = () => {};
  wrapped.onclose = () => {};
  try {
    await wrapped.start();
    await assert.rejects(() => wrapped.send(toolCall("http-disconnect", "lookup")));
    const failure = events.find((event) => event.event_type === "session" && event.error_class === "transport_error");
    assert.ok(failure);
    assert.equal(failure.success, false);
    assert.equal(failure.is_error, true);
    assert.equal(failure.payload_policy, "metadata");
  } finally {
    await wrapped.close().catch(() => {});
    await closeServer(server);
  }
});

test("real SSE server disconnect emits bounded transport failure evidence", async () => {
  let sseResponse;
  let endpointPath;
  let toolPost;
  const server = http.createServer((request, response) => {
    if (request.method === "GET" && request.url === "/sse") {
      sseResponse = response;
      response.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache", connection: "keep-alive" });
      endpointPath = "/messages";
      response.write(`event: endpoint\ndata: ${endpointPath}\n\n`);
      return;
    }
    if (request.method === "POST" && request.url === "/messages") {
      let body = "";
      request.on("data", (chunk) => { body += chunk; });
      request.on("end", () => {
        const message = JSON.parse(body);
        response.writeHead(202);
        response.end();
        if (message.method === "initialize") {
          sseResponse.write(`data: ${JSON.stringify({ jsonrpc: "2.0", id: message.id, result: { protocolVersion: "2025-06-18", capabilities: {}, serverInfo: { name: "sse-fixture", version: "1" } } })}\n\n`);
        } else if (message.method === "tools/call") {
          toolPost = message;
        }
      });
      return;
    }
    response.writeHead(404);
    response.end();
  });
  const endpoint = await listen(server);
  const events = [];
  const adapter = new TrackMCPClientAdapter({ apiKey: "tmcp_test", service: "adapter-test", transport: "sse", flushIntervalMs: 60000, onEvent: (event) => events.push(event) });
  const raw = new SSEClientTransport(new URL(`${endpoint}/sse`));
  const wrapped = adapter.wrapTransport(raw);
  wrapped.onerror = () => {};
  wrapped.onclose = () => {};
  let pendingSend;
  try {
    await wrapped.start();
    await wrapped.send({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "sse-client", version: "1" } } });
    pendingSend = wrapped.send(toolCall("sse-disconnect", "lookup"));
    await wait(20);
    assert.equal(toolPost?.method, "tools/call");
    sseResponse.destroy();
    await wait(100);
    const failure = events.find((event) => event.event_type === "tool_call" && event.error_class === "transport_error");
    assert.ok(failure);
    assert.equal(failure.transport, "sse");
    assert.equal(failure.success, false);
    assert.equal(failure.is_error, true);
    assert.equal(failure.payload_policy, "metadata");
    assert.equal(JSON.stringify(events).includes("private-sse-result"), false);
  } finally {
    await wrapped.close().catch(() => {});
    await pendingSend?.catch(() => {});
    await closeServer(server);
  }
});

class FakeTransport extends StdioClientTransport {
  constructor() {
    super({ command: process.execPath, args: ["-e", "process.stdin.resume()"], stderr: "ignore" });
    this.sent = [];
    this.sessionId = "fake-session";
  }
  async start() {}
  async send(message) { this.sent.push(message); }
  async close() { this.onclose?.(); }
  onmessage;
  onerror;
  onclose;
}

function toolCall(id, name = "search") {
  return { jsonrpc: "2.0", id, method: "tools/call", params: { name, arguments: {} } };
}

test("handles batches, notifications, malformed/unmatched messages, concurrency, and repeat semantics", async () => {
  const events = [];
  const raw = new FakeTransport();
  let resolverCalls = 0;
  const adapter = new TrackMCPClientAdapter({ apiKey: "tmcp_test", service: "adapter-test", transport: "stdio", disabled: false, flushIntervalMs: 60000, correlation: { mode: "external", resolve: ({ toolName }) => toolName === "search" ? `job_anon_${++resolverCalls}` : undefined }, onEvent: (event) => events.push(event) });
  const wrapped = adapter.wrapTransport(raw);
  await wrapped.start();
  let forwarded = 0;
  wrapped.onmessage = () => { forwarded += 1; };
  await wrapped.send([
    toolCall("one", "search"),
    { jsonrpc: "2.0", method: "notifications/tools/list_changed" },
    toolCall(undefined, "missing-id"),
    null,
  ]);
  raw.onmessage({ jsonrpc: "2.0", id: "one", result: { content: [{ type: "text", text: "ok" }] } });
  await wrapped.send(toolCall("two", "other"));
  await wrapped.send(toolCall("three", "search"));
  raw.onmessage([
    { jsonrpc: "2.0", id: "three", result: { content: [] } },
    { jsonrpc: "2.0", id: "two", result: { content: [] } },
    { jsonrpc: "2.0", id: "three", result: { content: [] } },
    { jsonrpc: "2.0", id: "unknown", result: {} },
    { jsonrpc: "2.0", result: {} },
  ]);
  await wrapped.send(toolCall("reuse", "first"));
  raw.onmessage({ jsonrpc: "2.0", id: "reuse", result: { content: [] } });
  await wrapped.send(toolCall("reuse", "second"));
  raw.onmessage({ jsonrpc: "2.0", id: "reuse", result: { content: [] } });
  await wrapped.close();

  const issued = events.filter((event) => event.payload?._trackmcp?.observation_kind === "tool_call_issued");
  const results = events.filter((event) => event.payload?._trackmcp?.observation_kind === "result_received");
  assert.equal(issued.length, 5);
  assert.equal(results.length, 4);
  assert.equal(issued.filter((event) => event.tool_name === "search" && event.payload._trackmcp.repeat_observed).length, 1);
  assert.equal(results.some((event) => event.request_id === "three"), true);
  assert.equal(adapter.getDiagnostics().malformedMessages >= 2, true);
  assert.equal(adapter.getDiagnostics().unmatchedMessages >= 2, true);
  assert.equal(adapter.getDiagnostics().duplicateMessages >= 1, true);
  assert.equal(forwarded, 4);
  assert.equal(JSON.stringify(adapter.getDiagnostics()).includes("one"), false);
  assert.equal(results.find((event) => event.request_id === "three").tool_name, "search");
  assert.equal(results.find((event) => event.request_id === "two").tool_name, "other");
  assert.equal(resolverCalls, 2);
  assert.equal(issued.find((event) => event.request_id === "three").correlation_handle, "job_anon_2");
  assert.equal(issued.find((event) => event.request_id === "three").correlation_handle_source, "external");
  assert.equal(results.find((event) => event.request_id === "three").correlation_handle, "job_anon_2");
  assert.equal(results.filter((event) => event.request_id === "reuse").length, 1);
  assert.notEqual(issued.find((event) => event.request_id === "three").correlation_handle, issued.find((event) => event.request_id === "three").request_id);
});

test("emits bounded request and response observations for non-tool MCP methods", async () => {
  const events = [];
  const raw = new FakeTransport();
  const adapter = new TrackMCPClientAdapter({ apiKey: "tmcp_test", service: "adapter-test", transport: "stdio", flushIntervalMs: 60000, onEvent: (event) => events.push(event) });
  const wrapped = adapter.wrapTransport(raw);
  await wrapped.start();
  wrapped.onmessage = () => {};
  wrapped.onerror = () => {};
  await wrapped.send({ jsonrpc: "2.0", id: "catalog-1", method: "resources/list", params: { private_filter: "do-not-capture" } });
  raw.onmessage({ jsonrpc: "2.0", id: "catalog-1", result: { resources: [{ uri: "secret://private", name: "customer-private" }], nextCursor: "private-cursor", ttlMs: 90000, cacheScope: "private" } });
  await wrapped.send({ jsonrpc: "2.0", id: "task-1", method: "tasks/get", params: { taskId: "task-secret" } });
  raw.onmessage({ jsonrpc: "2.0", id: "task-1", result: { resultType: "task", status: "working", taskId: "task-secret", inputRequests: ["private"], private_result: "do-not-capture" } });
  await wrapped.send({ jsonrpc: "2.0", method: "notifications/resources/list_changed", params: { private_state: "do-not-capture" } });
  raw.onmessage({ jsonrpc: "2.0", method: "notifications/progress", params: { progress: 99, private_state: "do-not-capture" } });
  await wrapped.send({ jsonrpc: "2.0", id: "subscription-1", method: "subscriptions/listen", params: { private_filter: "do-not-capture" } });
  raw.onmessage({ jsonrpc: "2.0", id: "subscription-1", result: { subscriptionId: "secret-subscription", ttlMs: 1000, cacheScope: "public" } });

  const requests = events.filter((event) => event.event_type === "protocol" && event.payload?._trackmcp?.observation_kind === "protocol_request");
  const responses = events.filter((event) => event.event_type === "protocol" && event.payload?._trackmcp?.observation_kind === "protocol_response");
  const notifications = events.filter((event) => event.event_type === "protocol" && event.payload?._trackmcp?.observation_kind === "protocol_notification");
  assert.equal(requests.length, 3);
  assert.equal(responses.length, 3);
  assert.equal(notifications.length, 2);
  assert.equal(responses.find((event) => event.mcp_method === "resources/list").catalog_kind, "resources");
  assert.equal(responses.find((event) => event.mcp_method === "resources/list").catalog_item_count, 1);
  assert.equal(responses.find((event) => event.mcp_method === "resources/list").payload._trackmcp.next_cursor_present, true);
  assert.equal(responses.find((event) => event.mcp_method === "resources/list").payload._trackmcp.cache_ttl_ms, 90000);
  assert.equal(responses.find((event) => event.mcp_method === "resources/list").payload._trackmcp.cache_scope, "private");
  assert.equal(responses.find((event) => event.mcp_method === "tasks/get").result_type, "task");
  assert.equal(responses.find((event) => event.mcp_method === "tasks/get").task_status, "working");
  assert.equal(responses.find((event) => event.mcp_method === "tasks/get").task_id.length, 64);
  assert.equal(responses.find((event) => event.mcp_method === "tasks/get").input_request_count, 1);
  assert.equal(requests.find((event) => event.mcp_method === "subscriptions/listen").payload._trackmcp.subscription_action, "listen_requested");
  assert.equal(responses.find((event) => event.mcp_method === "subscriptions/listen").payload._trackmcp.subscription_action, "subscription_started");
  assert.equal(notifications.find((event) => event.mcp_method === "notifications/resources/list_changed").payload._trackmcp.protocol_signal, "catalog_changed");
  assert.equal(notifications.find((event) => event.mcp_method === "notifications/progress").payload._trackmcp.protocol_signal, "progress");
  assert.equal(JSON.stringify(events).includes("private_filter"), false);
  assert.equal(JSON.stringify(events).includes("secret://private"), false);
  assert.equal(JSON.stringify(events).includes("task-secret"), false);
  assert.equal(JSON.stringify(events).includes("private-cursor"), false);
  assert.equal(JSON.stringify(events).includes("secret-subscription"), false);
  assert.equal(JSON.stringify(events).includes("private_state"), false);
  await wrapped.close();
});

test("observes cancellation notifications in both directions without retaining request IDs", async () => {
  const events = [];
  const raw = new FakeTransport();
  const adapter = new TrackMCPClientAdapter({ apiKey: "tmcp_test", service: "adapter-test", transport: "stdio", flushIntervalMs: 60000, onEvent: (event) => events.push(event) });
  const wrapped = adapter.wrapTransport(raw);
  await wrapped.start();
  wrapped.onmessage = () => {};
  await wrapped.send({ jsonrpc: "2.0", method: "notifications/cancelled", params: { requestId: "private-request-id", reason: "private-reason" } });
  raw.onmessage({ jsonrpc: "2.0", method: "notifications/cancelled", params: { requestId: "private-server-request-id", reason: "private-server-reason" } });
  const cancellations = events.filter((event) => event.event_type === "protocol" && event.payload?._trackmcp?.protocol_signal === "cancelled");
  assert.equal(cancellations.length, 2);
  assert.equal(cancellations.every((event) => event.mcp_method === "notifications/cancelled"), true);
  assert.equal(cancellations.every((event) => event.payload_policy === "metadata"), true);
  assert.equal(JSON.stringify(cancellations).includes("private-request-id"), false);
  assert.equal(JSON.stringify(cancellations).includes("private-reason"), false);
  await wrapped.close();
});

test("tracks a server-directed task lifecycle without retaining the raw handle", async () => {
  const events = [];
  const raw = new FakeTransport();
  const adapter = new TrackMCPClientAdapter({ apiKey: "tmcp_test", service: "adapter-test", transport: "stdio", flushIntervalMs: 60000, onEvent: (event) => events.push(event) });
  const wrapped = adapter.wrapTransport(raw);
  await wrapped.start();
  wrapped.onmessage = () => {};

  await wrapped.send(toolCall("create-task", "long_running"));
  raw.onmessage({ jsonrpc: "2.0", id: "create-task", result: { resultType: "task", taskId: "secret-task", status: "working" } });
  await wrapped.send({ jsonrpc: "2.0", id: "get-task", method: "tasks/get", params: { taskId: "secret-task" } });
  raw.onmessage({ jsonrpc: "2.0", id: "get-task", result: { taskId: "secret-task", status: "working" } });
  await wrapped.send({ jsonrpc: "2.0", id: "update-task", method: "tasks/update", params: { taskId: "secret-task", input: { private: "value" } } });
  raw.onmessage({ jsonrpc: "2.0", id: "update-task", result: { taskId: "secret-task", status: "input_required" } });
  await wrapped.send({ jsonrpc: "2.0", id: "cancel-task", method: "tasks/cancel", params: { taskId: "secret-task" } });
  raw.onmessage({ jsonrpc: "2.0", id: "cancel-task", result: {} });
  await wrapped.send({ jsonrpc: "2.0", id: "final-task", method: "tasks/get", params: { taskId: "secret-task" } });
  raw.onmessage({ jsonrpc: "2.0", id: "final-task", result: { taskId: "secret-task", status: "cancelled" } });

  const lifecycle = events.filter((event) => event.task_id);
  assert.equal(lifecycle.length, 4);
  assert.equal(new Set(lifecycle.map((event) => event.task_id)).size, 1);
  assert.deepEqual(lifecycle.map((event) => event.task_status), ["working", "working", "input_required", "cancelled"]);
  assert.equal(JSON.stringify(events).includes("secret-task"), false);
  assert.equal(JSON.stringify(events).includes("private"), false);
  await wrapped.close();
});

test("round-trips completion, sampling, and elicitation responses as bounded protocol metadata", async () => {
  const events = [];
  const raw = new FakeTransport();
  const adapter = new TrackMCPClientAdapter({ apiKey: "tmcp_test", service: "adapter-test", transport: "stdio", flushIntervalMs: 60000, onEvent: (event) => events.push(event) });
  const wrapped = adapter.wrapTransport(raw);
  await wrapped.start();
  wrapped.onmessage = () => {};

  await wrapped.send({ jsonrpc: "2.0", id: "completion-1", method: "completion/complete", params: { argument: { value: "private-search" }, private_context: "do-not-capture" } });
  raw.onmessage({ jsonrpc: "2.0", id: "completion-1", result: { completion: { values: ["private-result"], total: 1, hasMore: false } } });
  await wrapped.send({ jsonrpc: "2.0", id: "sampling-1", method: "sampling/createMessage", params: { messages: [{ role: "user", content: { type: "text", text: "private-prompt" } }] } });
  raw.onmessage({ jsonrpc: "2.0", id: "sampling-1", result: { model: "private-model", role: "assistant", content: { type: "text", text: "private-response" } } });
  await wrapped.send({ jsonrpc: "2.0", id: "elicitation-1", method: "elicitation/create", params: { message: "private-question", requestedSchema: { type: "object" } } });
  raw.onmessage({ jsonrpc: "2.0", id: "elicitation-1", result: { action: "accept", content: { secret_answer: "private-answer" } } });

  const responses = events.filter((event) => event.payload?._trackmcp?.observation_kind === "protocol_response");
  assert.equal(responses.length, 3);
  assert.deepEqual(responses.map((event) => event.payload._trackmcp.protocol_family), ["completion", "sampling", "elicitation"]);
  assert.equal(responses.every((event) => event.event_type === "protocol"), true);
  assert.equal(JSON.stringify(events).includes("private-search"), false);
  assert.equal(JSON.stringify(events).includes("private-result"), false);
  assert.equal(JSON.stringify(events).includes("private-prompt"), false);
  assert.equal(JSON.stringify(events).includes("private-response"), false);
  assert.equal(JSON.stringify(events).includes("private-question"), false);
  assert.equal(JSON.stringify(events).includes("private-answer"), false);
  await wrapped.close();
});

test("records bounded subscription metadata for resource subscribe and unsubscribe", async () => {
  const events = [];
  const raw = new FakeTransport();
  const adapter = new TrackMCPClientAdapter({ apiKey: "tmcp_test", service: "adapter-test", transport: "stdio", flushIntervalMs: 60000, onEvent: (event) => events.push(event) });
  const wrapped = adapter.wrapTransport(raw);
  await wrapped.start();
  wrapped.onmessage = () => {};
  wrapped.onerror = () => {};
  await wrapped.send({ jsonrpc: "2.0", id: "subscribe-1", method: "resources/subscribe", params: { uri: "secret://resource" } });
  raw.onmessage({ jsonrpc: "2.0", id: "subscribe-1", result: {} });
  await wrapped.send({ jsonrpc: "2.0", id: "unsubscribe-1", method: "resources/unsubscribe", params: { uri: "secret://resource" } });
  raw.onmessage({ jsonrpc: "2.0", id: "unsubscribe-1", result: {} });
  const requests = events.filter((event) => event.payload?._trackmcp?.observation_kind === "protocol_request");
  const responses = events.filter((event) => event.payload?._trackmcp?.observation_kind === "protocol_response");
  assert.equal(requests.find((event) => event.mcp_method === "resources/subscribe").payload._trackmcp.subscription_action, "subscribe_requested");
  assert.equal(requests.find((event) => event.mcp_method === "resources/unsubscribe").payload._trackmcp.subscription_action, "unsubscribe_requested");
  assert.equal(responses.find((event) => event.mcp_method === "resources/subscribe").payload._trackmcp.subscription_action, "subscription_started");
  assert.equal(responses.find((event) => event.mcp_method === "resources/unsubscribe").payload._trackmcp.subscription_action, "subscription_stopped");
  assert.equal(JSON.stringify(events).includes("secret://resource"), false);
  await wrapped.close();
});

test("re-establishes modern subscriptions after a transport reconnect without retaining subscription secrets", async () => {
  const events = [];
  const raw = new FakeTransport();
  const adapter = new TrackMCPClientAdapter({ apiKey: "tmcp_test", service: "adapter-test", transport: "stdio", flushIntervalMs: 60000, onEvent: (event) => events.push(event) });
  const wrapped = adapter.wrapTransport(raw);
  await wrapped.start();
  wrapped.onmessage = () => {};
  wrapped.onerror = () => {};

  const listen = async (requestId, subscriptionId) => {
    await wrapped.send({ jsonrpc: "2.0", id: requestId, method: "subscriptions/listen", params: { types: ["resources/updated"], private_filter: "do-not-capture" } });
    raw.onmessage({ jsonrpc: "2.0", id: requestId, result: { subscriptionId, types: ["resources/updated"], ttlMs: 5000, cacheScope: "private" } });
    raw.onmessage({ jsonrpc: "2.0", method: "notifications/resources/updated", params: { uri: "secret://customer-resource" } });
  };

  await listen("listen-1", "secret-subscription-1");
  await wrapped.close();
  await wrapped.start();
  await listen("listen-2", "secret-subscription-2");

  const responses = events.filter((event) => event.mcp_method === "subscriptions/listen" && event.payload?._trackmcp?.observation_kind === "protocol_response");
  const updates = events.filter((event) => event.mcp_method === "notifications/resources/updated");
  const starts = events.filter((event) => event.payload?._trackmcp?.observation_kind === "session_started");
  const reconnects = events.filter((event) => event.payload?._trackmcp?.observation_kind === "session_reconnected");
  assert.equal(responses.length, 2);
  assert.equal(updates.length, 2);
  assert.equal(reconnects.length, 1);
  assert.deepEqual(starts.map((event) => event.payload._trackmcp.lifecycle_generation), [1, 2]);
  assert.equal(responses.every((event) => event.payload._trackmcp.subscription_action === "subscription_started"), true);
  assert.equal(updates.every((event) => event.payload._trackmcp.protocol_signal === "resource_changed"), true);
  assert.equal(JSON.stringify(events).includes("secret-subscription"), false);
  assert.equal(JSON.stringify(events).includes("secret://customer-resource"), false);
  assert.equal(JSON.stringify(events).includes("private_filter"), false);
  await wrapped.close();
});

test("does not attribute an ambiguous late response to a reused request ID", async () => {
  const events = [];
  const raw = new FakeTransport();
  const adapter = new TrackMCPClientAdapter({ apiKey: "tmcp_test", service: "adapter-test", transport: "stdio", flushIntervalMs: 60000, onEvent: (event) => events.push(event) });
  const wrapped = adapter.wrapTransport(raw);
  await wrapped.start();
  wrapped.onmessage = () => {};
  await wrapped.send(toolCall("same", "first"));
  await wrapped.send(toolCall("same", "second"));
  raw.onmessage({ jsonrpc: "2.0", id: "same", result: { content: [{ type: "text", text: "late" }] } });
  assert.equal(events.filter((event) => event.payload?._trackmcp?.observation_kind === "result_received").length, 0);
  assert.equal(adapter.getDiagnostics().unmatchedMessages, 1);
  assert.equal(adapter.getDiagnostics().duplicateMessages, 1);
});

test("expires stale pending calls and drops responses that arrive after expiry", async () => {
  const events = [];
  const raw = new FakeTransport();
  const adapter = new TrackMCPClientAdapter({ apiKey: "tmcp_test", service: "adapter-test", transport: "stdio", flushIntervalMs: 60000, onEvent: (event) => events.push(event) });
  const wrapped = adapter.wrapTransport(raw);
  await wrapped.start();
  wrapped.onmessage = () => {};
  const realNow = Date.now;
  try {
    Date.now = () => 1000;
    await wrapped.send(toolCall("expired", "search"));
    Date.now = () => 1000 + 30_000 + 1;
    raw.onmessage({ jsonrpc: "2.0", id: "expired", result: { content: [{ type: "text", text: "late" }] } });
  } finally {
    Date.now = realNow;
  }
  assert.equal(events.filter((event) => event.payload?._trackmcp?.observation_kind === "result_received").length, 0);
  assert.equal(adapter.getDiagnostics().pending_request_count, 0);
  assert.equal(adapter.getDiagnostics().expiredMessages, 1);
  assert.equal(adapter.getDiagnostics().unmatchedMessages, 1);
  assert.equal(adapter.getDiagnostics().duplicateMessages, 1);
});

test("bounds pending calls and repeat groups, expires repeat state, and rejects oversized tool names", async () => {
  const events = [];
  const raw = new FakeTransport();
  const adapter = new TrackMCPClientAdapter({ apiKey: "tmcp_test", service: "adapter-test", transport: "stdio", flushIntervalMs: 60000, onEvent: (event) => events.push(event) });
  const wrapped = adapter.wrapTransport(raw);
  await wrapped.start();
  const realNow = Date.now;
  try {
    Date.now = () => 1000;
    await wrapped.send(toolCall("repeat-1", "search"));
    Date.now = () => 1000 + REPEAT_WINDOW_MS + 1;
    await wrapped.send(toolCall("repeat-2", "search"));
    assert.equal(events.filter((event) => event.payload?._trackmcp?.repeat_observed).length, 0);
    await wrapped.send(toolCall("too-long", "x".repeat(2049)));
    assert.equal(adapter.getDiagnostics().malformedMessages >= 1, true);
    for (let index = 0; index < 1100; index += 1) await wrapped.send(toolCall(`pending-${index}`, `tool-${index}`));
    assert.equal(adapter.getDiagnostics().pending_request_count <= 1000, true);
    assert.equal(adapter.getDiagnostics().repeat_group_count <= 1000, true);
  } finally {
    Date.now = realNow;
  }
});

test("deduplicates lifecycle events and gives hooks an immutable finalized copy", async () => {
  const events = [];
  const raw = new FakeTransport();
  const adapter = new TrackMCPClientAdapter({ apiKey: "tmcp_test", service: "adapter-test", transport: "stdio", flushIntervalMs: 60000, onEvent: (event) => {
    events.push(event);
    assert.equal(Object.isFrozen(event), true);
    assert.equal(Object.isFrozen(event.payload), true);
    try { event.payload.secret = "raw-secret"; } catch {}
    try { event.payload._trackmcp.observation_source = "server"; } catch {}
    try { event.payload.raw = "x".repeat(100000); } catch {}
    try { event.payload = { raw: "replacement" }; } catch {}
  } });
  const wrapped = adapter.wrapTransport(raw);
  await wrapped.start();
  await wrapped.start();
  await wrapped.close();
  raw.onclose?.();
  await wrapped.start();
  await wrapped.close();
  const starts = events.filter((event) => event.payload?._trackmcp?.observation_kind === "session_started");
  const reconnects = events.filter((event) => event.payload?._trackmcp?.observation_kind === "session_reconnected");
  const ends = events.filter((event) => event.payload?._trackmcp?.observation_kind === "session_ended");
  assert.equal(starts.length, 2);
  assert.equal(reconnects.length, 1);
  assert.equal(ends.length, 2);
  assert.deepEqual(starts.map((event) => event.payload._trackmcp.lifecycle_generation), [1, 2]);
  assert.deepEqual(reconnects.map((event) => event.payload._trackmcp.lifecycle_generation), [2]);
  assert.deepEqual(ends.map((event) => event.payload._trackmcp.lifecycle_generation), [1, 2]);
  assert.equal(starts.every((event) => event.duration_ms === 0), true);
  assert.equal(ends.every((event) => Number.isInteger(event.duration_ms) && event.duration_ms >= 0 && event.duration_ms <= 86_400_000), true);
  assert.equal(events.some((event) => JSON.stringify(event).includes("raw-secret")), false);
  assert.equal(events.some((event) => JSON.stringify(event).includes("replacement")), false);
});

test("failed start emits no lifecycle start and transport failures remain fail-open", async () => {
  const events = [];
  const raw = new FakeTransport();
  raw.start = async () => { throw new Error("transport unavailable"); };
  const adapter = new TrackMCPClientAdapter({ apiKey: "tmcp_test", service: "adapter-test", transport: "stdio", disabled: false, flushIntervalMs: 60000, onEvent: (event) => events.push(event) });
  await assert.rejects(() => adapter.wrapTransport(raw).start(), /transport unavailable/);
  assert.equal(events.length, 0);
  const throwingHook = new TrackMCPClientAdapter({ apiKey: "tmcp_test", service: "adapter-test", transport: "stdio", flushIntervalMs: 60000, onEvent: () => { throw new Error("hook"); } });
  const second = new FakeTransport();
  const wrapped = throwingHook.wrapTransport(second);
  await wrapped.start();
  await wrapped.send(toolCall("one"));
  assert.doesNotThrow(() => second.onmessage?.({ jsonrpc: "2.0", id: "one", result: {} }));
  assert.equal(throwingHook.getDiagnostics().hookErrors >= 1, true);
  assert.equal(throwingHook.getDiagnostics().queuedEvents, 0);
  assert.equal(throwingHook.getDiagnostics().droppedEvents >= 1, true);
  await wrapped.close();
});

test("transport errors close the lifecycle as a bounded failed session", async () => {
  const events = [];
  const raw = new FakeTransport();
  let forwardedError;
  const adapter = new TrackMCPClientAdapter({ apiKey: "tmcp_test", service: "adapter-test", transport: "stdio", flushIntervalMs: 60000, onEvent: (event) => events.push(event) });
  const wrapped = adapter.wrapTransport(raw);
  wrapped.onerror = (error) => { forwardedError = error; };
  await wrapped.start();
  raw.onerror?.(new Error("connection dropped"));
  raw.onclose?.();
  assert.equal(forwardedError?.message, "connection dropped");
  const ends = events.filter((event) => event.payload?._trackmcp?.observation_kind === "session_ended");
  assert.equal(ends.length, 1);
  assert.equal(ends[0].success, false);
  assert.equal(ends[0].is_error, true);
  assert.equal(ends[0].error_class, "transport_error");
  assert.equal(JSON.stringify(ends).includes("connection dropped"), false);
});

test("transport disconnect drains pending tool and protocol calls as bounded failures", async () => {
  const events = [];
  const raw = new FakeTransport();
  const adapter = new TrackMCPClientAdapter({ apiKey: "tmcp_test", service: "adapter-test", transport: "stdio", flushIntervalMs: 60000, onEvent: (event) => events.push(event) });
  const wrapped = adapter.wrapTransport(raw);
  await wrapped.start();
  wrapped.onmessage = () => {};
  wrapped.onerror = () => {};
  await wrapped.send(toolCall("pending-tool", "lookup"));
  await wrapped.send({ jsonrpc: "2.0", id: "pending-protocol", method: "tasks/get", params: { taskId: "secret-task" } });
  raw.onerror?.(new Error("connection dropped"));

  const failures = events.filter((event) => event.success === false && event.error_class === "transport_error");
  assert.equal(failures.filter((event) => event.event_type === "tool_call").length, 1);
  assert.equal(failures.filter((event) => event.event_type === "protocol").length, 1);
  assert.equal(failures.every((event) => event.is_error === true && event.payload_policy === "metadata"), true);
  assert.equal(JSON.stringify(events).includes("secret-task"), false);
  assert.equal(adapter.getDiagnostics().pending_request_count, 0);
});
