import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { withTrackMCP } from "../dist/index.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

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
  assert.equal(call.success, true);
  assert.ok(events.some((event) => event.event_type === "session"));
  assert.ok(events.some((event) => event.payload?.name === "tools_discovered"));
});
