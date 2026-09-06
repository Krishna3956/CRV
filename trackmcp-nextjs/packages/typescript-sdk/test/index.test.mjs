import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { withTrackMCP } from "../dist/index.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

test("captures a tool call, redacts args, and delivers a batch", async () => {
  const received = [];
  const server = http.createServer((request, response) => {
    let body = "";
    request.on("data", (chunk) => { body += chunk; });
    request.on("end", () => {
      received.push({ headers: request.headers, body: JSON.parse(body) });
      response.writeHead(200, { "content-type": "application/json" });
      response.end("{}");
    });
  });
  await new Promise((resolve) => server.listen(0, resolve));
  const endpoint = `http://127.0.0.1:${server.address().port}`;
  const wrapped = withTrackMCP({
    async request(input) {
      return { isError: false, content: [{ type: "text", text: "ok" }], input };
    },
  }, { apiKey: "tmcp_test", endpoint, redact: ["args.password"], disabled: false });

  await wrapped.request({ method: "tools/call", params: { name: "lookup", arguments: { password: "secret", query: "mcp" } } });
  await wrapped.trackmcp.flush();
  await new Promise((resolve) => setTimeout(resolve, 20));
  server.close();

  assert.equal(received.length, 1);
  assert.equal(received[0].headers.authorization, "Bearer tmcp_test");
  assert.equal(received[0].body.events[0].tool_name, "lookup");
  assert.equal(received[0].body.events[0].payload.args.password, "[redacted]");
  assert.equal(received[0].body.events[0].schema_version, "1");
  assert.equal(received[0].body.events[0].payload_size_bytes, Buffer.byteLength(JSON.stringify(received[0].body.events[0].payload)));
});

test("captures a real official MCP server transport call", async () => {
  const received = [];
  const ingest = http.createServer((request, response) => {
    let body = "";
    request.on("data", (chunk) => { body += chunk; });
    request.on("end", () => {
      received.push(JSON.parse(body));
      response.writeHead(200);
      response.end();
    });
  });
  await new Promise((resolve) => ingest.listen(0, resolve));
  const server = new McpServer({ name: "fixture", version: "1.0.0" });
  server.registerTool("hello", { description: "test tool" }, async () => ({ content: [{ type: "text", text: "hello" }] }));
  const wrapped = withTrackMCP(server, { apiKey: "tmcp_test", endpoint: `http://127.0.0.1:${ingest.address().port}`, flushIntervalMs: 60000 });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "fixture-client", version: "1.0.0" });
  await Promise.all([wrapped.connect(serverTransport), client.connect(clientTransport)]);
  await client.listTools();
  await client.callTool({ name: "hello", arguments: {} });
  await wrapped.trackmcp.flush();
  await new Promise((resolve) => setTimeout(resolve, 30));
  await client.close();
  await wrapped.close();
  ingest.close();

  const events = received.flatMap((batch) => batch.events);
  const call = events.find((event) => event.event_type === "tool_call");
  assert.ok(call);
  assert.equal(call.tool_name, "hello");
  assert.equal(call.client_name, "fixture-client");
  assert.equal(call.client_version, "1.0.0");
  assert.equal(call.session_id_source, "transport_generated");
  assert.equal(call.tool_description, "test tool");
  assert.match(call.tool_description_hash, /^[0-9a-f]{64}$/);
  assert.match(call.schema_hash, /^[0-9a-f]{64}$/);
  assert.equal(call.success, true);
  const session = events.find((event) => event.event_type === "session");
  assert.ok(session);
  assert.equal(session.client_version, "1.0.0");
  const catalog = events.find((event) => event.payload?.name === "tools_discovered");
  assert.ok(catalog);
  assert.equal(catalog.payload.tools[0].description, "test tool");
  assert.match(catalog.payload.tools[0].schema_hash, /^[0-9a-f]{64}$/);
});

test("correlation is disabled by default and external provenance is explicit", async () => {
  const received = [];
  const ingest = http.createServer((request, response) => {
    let body = "";
    request.on("data", (chunk) => { body += chunk; });
    request.on("end", () => { received.push(JSON.parse(body)); response.writeHead(200); response.end(); });
  });
  await new Promise((resolve) => ingest.listen(0, resolve));
  const wrapped = withTrackMCP({ async request() { return { isError: false }; } }, {
    apiKey: "tmcp_test",
    endpoint: `http://127.0.0.1:${ingest.address().port}`,
    correlation: { mode: "external", resolve: (context) => context.toolName === "lookup" ? "job_anon_1" : undefined },
    flushIntervalMs: 60000,
  });
  await wrapped.request({ method: "tools/call", params: { name: "lookup", arguments: {} } });
  await wrapped.trackmcp.flush();
  await new Promise((resolve) => setTimeout(resolve, 20));
  ingest.close();
  assert.equal(received[0].events[0].correlation_handle, "job_anon_1");
  assert.equal(received[0].events[0].correlation_handle_source, "external");
  assert.equal(received[0].events[0].request_id, undefined);

  const disabled = withTrackMCP({ async request() { return {}; } }, { apiKey: "tmcp_test", disabled: false, flushIntervalMs: 60000 });
  await disabled.request({ method: "tools/call", params: { name: "lookup", arguments: {} } });
  assert.equal(disabled.trackmcp.getDiagnostics().queuedEvents, 1);
  disabled.trackmcp.flush();
});

test("issued mode augments only compatible tool schemas and strips the echoed field", async () => {
  const received = [];
  const ingest = http.createServer((request, response) => {
    let body = "";
    request.on("data", (chunk) => { body += chunk; });
    request.on("end", () => { received.push(JSON.parse(body)); response.writeHead(200); response.end(); });
  });
  await new Promise((resolve) => ingest.listen(0, resolve));
  let handlerArguments;
  const server = new McpServer({ name: "fixture", version: "1.0.0" });
  server.registerTool("hello", { description: "test", inputSchema: z.object({ value: z.string().optional() }) }, async (args) => {
    handlerArguments = args;
    return { content: [{ type: "text", text: "hello" }] };
  });
  const wrapped = withTrackMCP(server, { apiKey: "tmcp_test", endpoint: `http://127.0.0.1:${ingest.address().port}`, correlation: { mode: "issued" }, flushIntervalMs: 60000 });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "issued-client", version: "1" });
  await Promise.all([wrapped.connect(serverTransport), client.connect(clientTransport)]);
  const listed = await client.listTools();
  const field = "__trackmcp_correlation_handle";
  assert.equal(listed.tools[0].inputSchema.properties[field].type, "string");
  const handle = listed.tools[0].inputSchema.properties[field].default;
  await client.callTool({ name: "hello", arguments: { value: "ok", [field]: handle } });
  await wrapped.trackmcp.flush();
  await new Promise((resolve) => setTimeout(resolve, 20));
  await client.close();
  await wrapped.close();
  ingest.close();
  assert.deepEqual(handlerArguments, { value: "ok" });
  const call = received.flatMap((batch) => batch.events).find((event) => event.event_type === "tool_call");
  assert.equal(call.correlation_handle, handle);
  assert.equal(call.correlation_handle_source, "issued");
  assert.equal(JSON.stringify(call.payload).includes(field), false);
});

test("captures context provenance, uses bounded fallback, and reports missing capabilities", async () => {
  const received = [];
  const ingest = http.createServer((request, response) => {
    let body = "";
    request.on("data", (chunk) => { body += chunk; });
    request.on("end", () => { received.push(JSON.parse(body)); response.writeHead(200); response.end(); });
  });
  await new Promise((resolve) => ingest.listen(0, resolve));
  const fallbackContexts = [];
  const wrapped = withTrackMCP({
    async request(input) { return { isError: false, input }; },
  }, {
    apiKey: "tmcp_test",
    endpoint: `http://127.0.0.1:${ingest.address().port}`,
    intentFallback: (context) => fallbackContexts.push(context) && "Complete the lookup",
    correlation: { mode: "external", resolve: () => "job_anon_1" },
    flushIntervalMs: 60000,
  });
  await wrapped.request({ method: "tools/call", params: { name: "lookup", arguments: { context: "Find the relevant documentation", token: "not telemetry context" } } });
  await wrapped.request({ method: "tools/call", params: { name: "lookup", arguments: {} } });
  wrapped.trackmcp.reportMissing("bulk_export", "Export all matching records");
  wrapped.trackmcp.capture({ event_type: "custom", started_at: new Date().toISOString(), context: "Resolve the deployment issue", intent_source: "external_callback" });
  wrapped.trackmcp.capture({ event_type: "custom", started_at: new Date().toISOString(), context: "Bearer should not be captured" });
  await wrapped.trackmcp.flush();
  await new Promise((resolve) => setTimeout(resolve, 20));
  ingest.close();

  const events = received.flatMap((batch) => batch.events);
  const explicit = events.find((event) => event.event_type === "tool_call" && event.context === "Find the relevant documentation");
  const fallback = events.find((event) => event.context === "Complete the lookup");
  const missing = events.find((event) => event.mcp_method === "trackmcp_report_missing");
  const external = events.find((event) => event.intent_source === "external_callback");
  const unsafe = events.find((event) => event.context === "Bearer should not be captured");
  assert.equal(explicit.intent_source, "context_parameter");
  assert.equal(fallback.intent_source, "fallback");
  assert.equal(missing.missing_capability, "bulk_export");
  assert.equal(missing.correlation_handle_source, "external");
  assert.equal(external.intent_source, "external_callback");
  assert.equal(unsafe, undefined);
  assert.equal(fallbackContexts[0].toolName, "lookup");
  assert.equal("args" in fallbackContexts[0], false);
});

test("injects optional context only when it does not collide with a customer field", async () => {
  const server = new McpServer({ name: "fixture", version: "1.0.0" });
  server.registerTool("with_context", { inputSchema: z.object({ context: z.string().optional() }) }, async (args) => ({ content: [{ type: "text", text: args.context || "none" }] }));
  server.registerTool("without_context", { inputSchema: z.object({ value: z.string().optional() }) }, async (args) => ({ content: [{ type: "text", text: args.value || "none" }] }));
  const wrapped = withTrackMCP(server, { apiKey: "tmcp_test", disabled: false, flushIntervalMs: 60000 });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "context-client", version: "1" });
  await Promise.all([wrapped.connect(serverTransport), client.connect(clientTransport)]);
  const listed = await client.listTools();
  assert.equal(listed.tools.find((tool) => tool.name === "with_context").inputSchema.properties.context.description, undefined);
  assert.equal(listed.tools.find((tool) => tool.name === "without_context").inputSchema.properties.context.description, "Optional one-sentence description of the user’s underlying goal.");
  await client.close();
  await wrapped.close();
});

test("expired pending requests are cleaned up and cannot attach to a later response", async () => {
  const rawTransport = { async send() {}, onmessage: undefined };
  const server = { connect(transport) { this.transport = transport; transport.onmessage = () => {}; return Promise.resolve(); } };
  const wrapped = withTrackMCP(server, { apiKey: "tmcp_test", disabled: false, flushIntervalMs: 60000 });
  await wrapped.connect(rawTransport);
  const originalNow = Date.now;
  try {
    const firstStarted = originalNow();
    server.transport.onmessage({ id: "stale", method: "tools/call", params: { name: "lookup", arguments: {} } });
    Date.now = () => firstStarted + 30001;
    server.transport.onmessage({ id: "current", method: "tools/call", params: { name: "lookup", arguments: {} } });
    server.transport.send({ id: "stale", result: { isError: false } });
    assert.equal(wrapped.trackmcp.getDiagnostics().queuedEvents, 0);
  } finally {
    Date.now = originalNow;
  }
});
