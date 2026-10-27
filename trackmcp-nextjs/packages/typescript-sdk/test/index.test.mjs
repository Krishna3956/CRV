import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { withTrackMCP, catalogObservation, interactionEntityObservation, protocolCapabilities } from "../dist/index.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

test("catalog observation hashes resource identities without retaining URI or prompt arguments", () => {
  const resource = catalogObservation("resources", { resources: [{ name: "docs", uri: "secret://user:pass/private" }] });
  assert.equal(resource.catalog_item_count, 1);
  assert.equal(resource.catalog_item_name_hashes.length, 1);
  assert.equal(resource.catalog_item_uri_hashes.length, 1);
  assert.ok(!JSON.stringify(resource).includes("secret"));
  const prompt = catalogObservation("prompts", { prompts: [{ name: "summarize", arguments: [{ name: "private" }] }] });
  assert.equal(prompt.catalog_kind, "prompts");
  assert.ok(!JSON.stringify(prompt).includes("private"));
});

test("single resource and prompt reads emit only bounded identity hashes", () => {
  const resource = interactionEntityObservation("resources/read", { uri: "secret://user:pass/private" });
  assert.equal(resource.kind, "resources");
  assert.match(resource.hash, /^[0-9a-f]{64}$/);
  assert.ok(!JSON.stringify(resource).includes("secret"));
  const prompt = interactionEntityObservation("prompts/get", { name: "private-prompt" });
  assert.equal(prompt.kind, "prompts");
  assert.match(prompt.hash, /^[0-9a-f]{64}$/);
  assert.equal(interactionEntityObservation("tools/call", { uri: "not-observed" }), undefined);
});

test("capability negotiation metadata is bounded and does not retain initialize bodies", () => {
  const capabilities = protocolCapabilities({ capabilities: { tools: {}, resources: { subscribe: true }, "server.example": {}, "io.modelcontextprotocol/tasks": { experimental: true }, "unsafe key": {}, nested: { secret: "private" } } });
  assert.deepEqual(capabilities, ["io.modelcontextprotocol/tasks", "nested", "resources", "server.example", "tools"]);
  assert.equal(JSON.stringify(capabilities).includes("private"), false);
  assert.deepEqual(protocolCapabilities({ capabilities: ["tools"] }), []);
});

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
  assert.equal(received[0].body.events[0].observation_source, "server");
  assert.equal(received[0].body.events[0].payload_size_bytes, Buffer.byteLength(JSON.stringify(received[0].body.events[0].payload)));
});

test("records allowlisted protocol signals without notification payloads", async () => {
  const received = [];
  const server = http.createServer((request, response) => {
    let body = "";
    request.on("data", (chunk) => { body += chunk; });
    request.on("end", () => { received.push(JSON.parse(body)); response.writeHead(200); response.end("{}"); });
  });
  await new Promise((resolve) => server.listen(0, resolve));
  const wrapped = withTrackMCP({ async request() { return {}; } }, { apiKey: "tmcp_test", endpoint: `http://127.0.0.1:${server.address().port}`, disabled: false, flushIntervalMs: 60000 });
  wrapped.trackmcp.recordProtocolSignal("progress", "notifications/progress", "session-1");
  wrapped.trackmcp.recordProtocolSignal("cancelled", "notifications/cancelled", "session-1");
  wrapped.trackmcp.recordProtocolSignal("subscription_started", "resources/subscribe", "session-1");
  wrapped.trackmcp.recordProtocolSignal("subscription_stopped", "resources/unsubscribe", "session-1");
  wrapped.trackmcp.recordProtocolSignal("cancelled", "notifications/cancelled", "session-1", "client_to_server");
  wrapped.trackmcp.recordProtocolSignal("raw", "notifications/progress", "session-1");
  await wrapped.trackmcp.flush();
  await new Promise((resolve) => setTimeout(resolve, 20));
  server.close();
  const events = received.flatMap((batch) => batch.events);
  assert.deepEqual(events.map((event) => event.payload._trackmcp.protocol_signal), ["progress", "cancelled", "subscription_started", "subscription_stopped", "cancelled"]);
  assert.equal(events[4].direction, "client_to_server");
  assert.equal(JSON.stringify(events).includes("progress_value"), false);
  assert.equal(JSON.stringify(events).includes("reason"), false);
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
  assert.doesNotMatch(JSON.stringify(catalog), /hello|test tool|secret/i);
  assert.equal(catalog.catalog_item_count, 1);
  assert.match(catalog.catalog_item_name_hashes[0], /^[0-9a-f]{64}$/);
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

test("account resolver emits a one-way account key and fails open", async () => {
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
    accountIdResolver: () => "workspace:acme-123",
    flushIntervalMs: 60000,
  });
  await wrapped.request({ method: "tools/call", params: { name: "lookup", arguments: {} } });
  await wrapped.trackmcp.flush();
  await new Promise((resolve) => setTimeout(resolve, 20));
  ingest.close();
  const event = received[0].events[0];
  assert.equal(event.account_identity_source, "resolver");
  assert.match(event.account_key, /^[0-9a-f]{64}$/);
  assert.equal(event.account_key.includes("acme"), false);

  const failing = withTrackMCP({ async request() { return {}; } }, { apiKey: "tmcp_test", accountIdResolver: () => { throw new Error("resolver unavailable"); }, flushIntervalMs: 60000 });
  await failing.request({ method: "tools/call", params: { name: "lookup", arguments: {} } });
  assert.equal(failing.trackmcp.getDiagnostics().queuedEvents, 1);
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

test("transport observer preserves Streamable HTTP, SSE, stdio, and custom kinds", async () => {
  const received = [];
  const ingest = http.createServer((request, response) => {
    let body = "";
    request.on("data", (chunk) => { body += chunk; });
    request.on("end", () => { received.push(JSON.parse(body)); response.writeHead(200); response.end(); });
  });
  await new Promise((resolve) => ingest.listen(0, resolve));
  class StdioClientTransport { async send() {} }
  class StreamableHTTPClientTransport { async send() {} }
  class SSEClientTransport { async send() {} }
  class VendorTransport { async send() {} }
  try {
    for (const [Transport, expected] of [[StdioClientTransport, "stdio"], [StreamableHTTPClientTransport, "streamable_http"], [SSEClientTransport, "sse"], [VendorTransport, "custom"]]) {
      const rawTransport = new Transport();
      const server = { connect(transport) { this.transport = transport; transport.onmessage = () => {}; return Promise.resolve(); } };
      const wrapped = withTrackMCP(server, { apiKey: "tmcp_test", endpoint: `http://127.0.0.1:${ingest.address().port}`, flushIntervalMs: 60000 });
      await wrapped.connect(rawTransport);
      server.transport.onmessage({ id: "transport-1", method: "initialize", params: { clientInfo: { name: "transport-test", version: "1" } } });
      await server.transport.send({ id: "transport-1", result: { protocolVersion: "2025-06-18" } });
      await wrapped.trackmcp.flush();
      assert.equal(received.at(-1).events.at(-1).transport, expected);
    }
  } finally {
    ingest.close();
  }
});

test("captures bounded semantic results for non-tool protocol requests without response bodies", async () => {
  const received = [];
  const ingest = http.createServer((request, response) => {
    let body = "";
    request.on("data", (chunk) => { body += chunk; });
    request.on("end", () => { received.push(JSON.parse(body)); response.writeHead(200); response.end(); });
  });
  await new Promise((resolve) => ingest.listen(0, resolve));
  const rawTransport = { async send() {}, onmessage: undefined };
  const server = { connect(transport) { this.transport = transport; transport.onmessage = () => {}; return Promise.resolve(); } };
  const wrapped = withTrackMCP(server, { apiKey: "tmcp_test", endpoint: `http://127.0.0.1:${ingest.address().port}`, flushIntervalMs: 60000 });
  await wrapped.connect(rawTransport);
  server.transport.onmessage({ id: "sampling-1", method: "sampling/createMessage", params: { private_prompt: "do not persist" } });
  await server.transport.send({ id: "sampling-1", result: { resultType: "input_required", inputRequests: ["private-request", "private-request-2"], inputResponses: ["private-response"], private_result: "do not persist" } });
  await wrapped.trackmcp.flush();
  await new Promise((resolve) => setTimeout(resolve, 20));
  ingest.close();
  const events = received.flatMap((batch) => batch.events);
  const response = events.find((event) => event.mcp_method === "sampling/createMessage" && event.direction === "server_to_client");
  assert.ok(response);
  assert.equal(response.event_type, "protocol");
  assert.equal(response.result_type, "input_required");
  assert.equal(response.input_request_count, 2);
  assert.equal(response.input_response_count, 1);
  assert.equal(response.success, true);
  assert.deepEqual(response.payload, { name: "protocol_response_observed", _trackmcp: { observation_kind: "protocol_response", observation_source: "server" } });
  assert.equal(JSON.stringify(response).includes("private_"), false);
});

test("records bounded subscription lifecycle actions on server protocol responses", async () => {
  const received = [];
  const ingest = http.createServer((request, response) => {
    let body = "";
    request.on("data", (chunk) => { body += chunk; });
    request.on("end", () => { received.push(JSON.parse(body)); response.writeHead(200); response.end(); });
  });
  await new Promise((resolve) => ingest.listen(0, resolve));
  const rawTransport = { async send() {}, onmessage: undefined };
  const server = { connect(transport) { this.transport = transport; transport.onmessage = () => {}; return Promise.resolve(); } };
  const wrapped = withTrackMCP(server, { apiKey: "tmcp_test", endpoint: `http://127.0.0.1:${ingest.address().port}`, flushIntervalMs: 60000 });
  await wrapped.connect(rawTransport);
  server.transport.onmessage({ id: "subscribe-1", method: "resources/subscribe", params: { uri: "file:///private/config" } });
  await server.transport.send({ id: "subscribe-1", result: {} });
  server.transport.onmessage({ id: "unsubscribe-1", method: "resources/unsubscribe", params: { uri: "file:///private/config" } });
  await server.transport.send({ id: "unsubscribe-1", result: {} });
  await wrapped.trackmcp.flush();
  await new Promise((resolve) => setTimeout(resolve, 20));
  ingest.close();
  const responses = received.flatMap((batch) => batch.events).filter((event) => event.direction === "server_to_client");
  assert.deepEqual(responses.map((event) => event.payload?._trackmcp?.subscription_action), ["subscription_started", "subscription_stopped"]);
  assert.equal(JSON.stringify(responses).includes("private/config"), false);
});

test("hashes task handles and records explicit task state for lifecycle methods", async () => {
  const received = [];
  const ingest = http.createServer((request, response) => {
    let body = "";
    request.on("data", (chunk) => { body += chunk; });
    request.on("end", () => { received.push(JSON.parse(body)); response.writeHead(200); response.end(); });
  });
  await new Promise((resolve) => ingest.listen(0, resolve));
  const rawTransport = { async send() {}, onmessage: undefined };
  const server = { connect(transport) { this.transport = transport; transport.onmessage = () => {}; return Promise.resolve(); } };
  const wrapped = withTrackMCP(server, { apiKey: "tmcp_test", endpoint: `http://127.0.0.1:${ingest.address().port}`, flushIntervalMs: 60000 });
  await wrapped.connect(rawTransport);
  server.transport.onmessage({ id: "task-get-1", method: "tasks/get", params: { taskId: "private-task-handle" } });
  await server.transport.send({ id: "task-get-1", result: { status: "working", taskId: "private-task-handle" } });
  await wrapped.trackmcp.flush();
  await new Promise((resolve) => setTimeout(resolve, 20));
  ingest.close();
  const events = received.flatMap((batch) => batch.events);
  const request = events.find((event) => event.mcp_method === "tasks/get" && event.direction === "client_to_server");
  const response = events.find((event) => event.mcp_method === "tasks/get" && event.direction === "server_to_client");
  assert.ok(request);
  assert.ok(response);
  assert.match(request.task_id, /^[a-f0-9]{64}$/);
  assert.equal(response.task_id, request.task_id);
  assert.equal(response.payload.task_status, "working");
  assert.equal(JSON.stringify(events).includes("private-task-handle"), false);
});
