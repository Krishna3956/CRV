import assert from "node:assert/strict";
import test from "node:test";
import { ModernMcpClient, ModernMcpProtocolError, MODERN_MCP_PROTOCOL_VERSION } from "../dist/modern-client.js";

function response(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });
}

test("modern client sends bounded server/discover request and sanitizes metadata", async () => {
  let request;
  const client = new ModernMcpClient({ endpoint: "https://mcp.example.test", fetch: async (_input, init) => { request = init; return response({ jsonrpc: "2.0", id: 1, result: { supportedVersions: [MODERN_MCP_PROTOCOL_VERSION, "2025-06-18", "\u0000bad"], serverInfo: { name: "Fixture", version: "1.2", secret: "omit" }, capabilities: { tools: {}, resources: {}, "not safe": {} } } }); } });
  const discovery = await client.discover();
  assert.equal(request.headers.get("mcp-protocol-version"), MODERN_MCP_PROTOCOL_VERSION);
  assert.equal(request.headers.get("mcp-method"), "server/discover");
  assert.deepEqual(JSON.parse(request.body).method, "server/discover");
  assert.deepEqual(discovery, { protocolVersion: MODERN_MCP_PROTOCOL_VERSION, supportedVersions: [MODERN_MCP_PROTOCOL_VERSION, "2025-06-18"], serverInfo: { name: "Fixture", version: "1.2" }, capabilityNames: ["tools", "resources"] });
});

test("modern client rejects credentials, oversized responses, and non-success statuses", async () => {
  await assert.rejects(() => new ModernMcpClient({ endpoint: "https://user:secret@mcp.example.test", fetch: async () => response({}) }).discover(), (error) => error instanceof ModernMcpProtocolError && error.code === "invalid_endpoint");
  await assert.rejects(() => new ModernMcpClient({ endpoint: "https://mcp.example.test", fetch: async () => response({ error: "no" }, 401) }).discover(), (error) => error instanceof ModernMcpProtocolError && error.code === "http_error" && error.status === 401);
  await assert.rejects(() => new ModernMcpClient({ endpoint: "https://mcp.example.test", fetch: async () => response({ result: { blob: "x" } }, 200, { "content-length": "300000" }) }).discover(), (error) => error instanceof ModernMcpProtocolError && error.code === "response_too_large");
});

test("modern client lists a bounded, cursor-based tool catalog", async () => {
  let request;
  const client = new ModernMcpClient({ endpoint: "https://mcp.example.test", fetch: async (_input, init) => {
    request = init;
    return response({ jsonrpc: "2.0", id: 1, result: {
      tools: [
        { name: "search", description: "Find things", inputSchema: { type: "object", properties: { query: { type: "string" } } } },
        { name: "bad name", description: "omit" },
        { name: "\\u0000secret", description: "omit" },
      ],
      nextCursor: "cursor-2",
    } });
  } });
  const page = await client.listTools("cursor-1");
  assert.equal(request.headers.get("mcp-method"), "tools/list");
  assert.deepEqual(JSON.parse(request.body).params, { cursor: "cursor-1" });
  assert.deepEqual(page, {
    tools: [{ name: "search", description: "Find things", inputSchema: { type: "object", properties: { query: { type: "string" } } } }],
    nextCursor: "cursor-2",
  });
});

test("modern client rejects a tools/list response without an array", async () => {
  const client = new ModernMcpClient({ endpoint: "https://mcp.example.test", fetch: async () => response({ result: {} }) });
  await assert.rejects(() => client.listTools(), (error) => error instanceof ModernMcpProtocolError && error.code === "invalid_response");
});

test("modern client lists bounded resource and prompt catalogs without reading contents", async () => {
  const requests = [];
  const client = new ModernMcpClient({ endpoint: "https://mcp.example.test", fetch: async (_input, init) => {
    const body = JSON.parse(init.body);
    requests.push(body);
    return body.method === "resources/list"
      ? response({ result: { resources: [{ uri: "file:///safe/report", name: "Report", description: "A report", mimeType: "text/plain" }, { uri: "\u0000bad" }], nextCursor: "resource-cursor" } })
      : response({ result: { prompts: [{ name: "summarize", description: "Summarize", arguments: [{ name: "format", description: "ignored", required: true }, { name: "secret", default: "never returned" }] }, { name: "bad name!" }], nextCursor: "prompt-cursor" } });
  } });
  const resources = await client.listResources("resource-page");
  const prompts = await client.listPrompts();
  assert.deepEqual(requests.map(({ method, params }) => ({ method, params })), [
    { method: "resources/list", params: { cursor: "resource-page" } },
    { method: "prompts/list", params: {} },
  ]);
  assert.deepEqual(resources, { resources: [{ uri: "file:///safe/report", name: "Report", description: "A report", mimeType: "text/plain" }], nextCursor: "resource-cursor" });
  assert.deepEqual(prompts, { prompts: [{ name: "summarize", description: "Summarize", argumentNames: ["format", "secret"] }], nextCursor: "prompt-cursor" });
  assert.equal(JSON.stringify(prompts).includes("never returned"), false);
});

test("modern client rejects malformed resource and prompt catalog envelopes", async () => {
  const client = new ModernMcpClient({ endpoint: "https://mcp.example.test", fetch: async (_input, init) => response({ result: { [JSON.parse(init.body).method === "resources/list" ? "prompts" : "resources"]: [] } }) });
  await assert.rejects(() => client.listResources(), (error) => error instanceof ModernMcpProtocolError && error.code === "invalid_response");
  await assert.rejects(() => client.listPrompts(), (error) => error instanceof ModernMcpProtocolError && error.code === "invalid_response");
});

test("modern client observes bounded task pages and status without mutation", async () => {
  const requests = [];
  const client = new ModernMcpClient({ endpoint: "https://mcp.example.test", fetch: async (_input, init) => {
    const body = JSON.parse(init.body);
    requests.push(body);
    return body.method === "tasks/list"
      ? response({ result: { tasks: [{ taskId: "task-1", status: "working" }, { taskId: "bad id", status: "omit" }], nextCursor: "task-cursor" } })
      : response({ result: { taskId: "task-1", status: "completed", result: { secret: "omit" } } });
  } });
  const page = await client.listTasks();
  const task = await client.getTask(page.tasks[0].taskId);
  assert.deepEqual(requests.map(({ method, params }) => ({ method, params })), [
    { method: "tasks/list", params: { limit: 32 } },
    { method: "tasks/get", params: { taskId: "task-1" } },
  ]);
  assert.deepEqual(page, { tasks: [{ taskId: "task-1", status: "working" }], nextCursor: "task-cursor" });
  assert.deepEqual(task, { taskId: "task-1", status: "completed" });
});

test("modern client rejects malformed task status and unsafe task identifiers", async () => {
  const client = new ModernMcpClient({ endpoint: "https://mcp.example.test", fetch: async () => response({ result: { tasks: [{ taskId: "task-1" }] } }) });
  assert.deepEqual(await client.listTasks(), { tasks: [] });
  await assert.rejects(() => client.getTask("task id"), (error) => error instanceof ModernMcpProtocolError && error.code === "invalid_response");
});
