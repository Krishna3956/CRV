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
import { TrackMCPClientAdapter } from "../dist/client-adapter.js";
import { TrackMCPClient } from "../dist/index.js";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const REPEAT_WINDOW_MS = 5 * 60 * 1000;

test("pins the MCP dependency and exposes the adapter only through the Node export condition", async () => {
  const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  assert.equal(packageJson.peerDependencies["@modelcontextprotocol/sdk"], "1.30.0");
  assert.equal(packageJson.devDependencies["@modelcontextprotocol/sdk"], "1.30.0");
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
    const result = spawnSync(process.execPath, [nextBin, "build"], { cwd: tempDir, encoding: "utf8" });
    assert.notEqual(result.status, 0);
    assert.match(result.stdout + "\n" + result.stderr, /client-adapter|export|browser|resolve|Node\.js/i);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("rejects structurally similar unsupported transports", () => {
  const adapter = new TrackMCPClientAdapter({ apiKey: "tmcp_test", service: "adapter-test", transport: "stdio" });
  assert.throws(() => adapter.wrapTransport({ start() {}, send() {}, close() {} }), /official StdioClientTransport/);
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

test("uses MCP SDK 1.30.0 with a real StdioClientTransport and captures protocol identity", async () => {
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
        if (message.method === "initialize") result = { protocolVersion: "2025-06-18", capabilities: {}, serverInfo: { name: "stdio-fixture", version: "1" }, sessionId: "stdio-protocol-session" };
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
  assert.ok(issued);
  assert.ok(result);
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
  const ends = events.filter((event) => event.payload?._trackmcp?.observation_kind === "session_ended");
  assert.equal(starts.length, 2);
  assert.equal(ends.length, 2);
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
