import assert from "node:assert/strict";
import test from "node:test";
import { ModernMcpClient, ModernMcpProtocolError, MODERN_MCP_PROTOCOL_VERSION } from "../dist/modern-client.js";

function response(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });
}

function sseResponse(events, status = 200) {
  return new Response(events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join(""), { status, headers: { "content-type": "text/event-stream" } });
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

test("modern client assigns distinct JSON-RPC ids to concurrent requests", async () => {
  const ids = [];
  const client = new ModernMcpClient({ endpoint: "https://mcp.example.test", fetch: async (_input, init) => {
    ids.push(JSON.parse(init.body).id);
    await new Promise((resolve) => setTimeout(resolve, 1));
    return response({ result: { tools: [] } });
  } });
  await Promise.all([client.listTools(), client.listTools()]);
  assert.equal(ids.length, 2);
  assert.equal(new Set(ids).size, 2);
  assert.deepEqual(ids, [1, 2]);
});

test("modern client rejects credentials, oversized responses, and non-success statuses", async () => {
  await assert.rejects(() => new ModernMcpClient({ endpoint: "https://user:secret@mcp.example.test", fetch: async () => response({}) }).discover(), (error) => error instanceof ModernMcpProtocolError && error.code === "invalid_endpoint");
  await assert.rejects(() => new ModernMcpClient({ endpoint: "https://mcp.example.test", fetch: async () => response({ error: "no" }, 401) }).discover(), (error) => error instanceof ModernMcpProtocolError && error.code === "http_error" && error.status === 401);
  await assert.rejects(() => new ModernMcpClient({ endpoint: "https://mcp.example.test", fetch: async () => response({ result: { blob: "x" } }, 200, { "content-length": "300000" }) }).discover(), (error) => error instanceof ModernMcpProtocolError && error.code === "response_too_large");
});

test("modern client rejects a response whose JSON-RPC id does not correlate", async () => {
  const client = new ModernMcpClient({ endpoint: "https://mcp.example.test", fetch: async () => response({ jsonrpc: "2.0", id: 99, result: { tools: [] } }) });
  await assert.rejects(() => client.listTools(), (error) => error instanceof ModernMcpProtocolError && error.code === "invalid_response");
});

test("modern client resolves a bounded Streamable HTTP SSE response after notifications", async () => {
  const client = new ModernMcpClient({ endpoint: "https://mcp.example.test", fetch: async () => sseResponse([
    { jsonrpc: "2.0", method: "notifications/progress", params: { progress: 1 } },
    { jsonrpc: "2.0", id: 1, result: { tools: [{ name: "search" }] } },
  ]) });
  assert.deepEqual(await client.listTools(), { tools: [{ name: "search" }] });
});

test("modern client rejects an SSE stream without a matching result", async () => {
  const client = new ModernMcpClient({ endpoint: "https://mcp.example.test", fetch: async () => sseResponse([{ jsonrpc: "2.0", id: 9, result: { tools: [] } }]) });
  await assert.rejects(() => client.listTools(), (error) => error instanceof ModernMcpProtocolError && error.code === "invalid_response");
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

test("modern client follows opaque catalog cursors and discloses truncation", async () => {
  const methods = [];
  const client = new ModernMcpClient({ endpoint: "https://mcp.example.test", fetch: async (_input, init) => {
    const body = JSON.parse(init.body);
    methods.push({ method: body.method, params: body.params });
    const cursor = body.params?.cursor;
    if (body.method === "tools/list") return response({ result: cursor ? { tools: [{ name: "second" }] } : { tools: [{ name: "first" }], nextCursor: "tools-2" } });
    if (body.method === "resources/list") return response({ result: cursor ? { resources: [{ uri: "file:///second" }] } : { resources: [{ uri: "file:///first" }], nextCursor: "resources-2" } });
    return response({ result: cursor ? { prompts: [{ name: "second" }] } : { prompts: [{ name: "first" }], nextCursor: "prompts-2" } });
  } });
  assert.deepEqual(await client.listAllTools(), { items: [{ name: "first" }, { name: "second" }], truncated: false });
  assert.deepEqual(await client.listAllResources(), { items: [{ uri: "file:///first" }, { uri: "file:///second" }], truncated: false });
  assert.deepEqual(await client.listAllPrompts(), { items: [{ name: "first", argumentNames: [] }, { name: "second", argumentNames: [] }], truncated: false });
  assert.deepEqual(methods.map(({ method, params }) => ({ method, params })), [
    { method: "tools/list", params: {} }, { method: "tools/list", params: { cursor: "tools-2" } },
    { method: "resources/list", params: {} }, { method: "resources/list", params: { cursor: "resources-2" } },
    { method: "prompts/list", params: {} }, { method: "prompts/list", params: { cursor: "prompts-2" } },
  ]);
});

test("modern client stops on a repeated cursor instead of looping", async () => {
  let requests = 0;
  const client = new ModernMcpClient({ endpoint: "https://mcp.example.test", fetch: async () => {
    requests += 1;
    return response({ result: { tools: [{ name: `tool-${requests}` }], nextCursor: "same" } });
  } });
  assert.deepEqual(await client.listAllTools(), { items: [{ name: "tool-1" }, { name: "tool-2" }], truncated: true });
  assert.equal(requests, 2);
});

test("modern client refuses the removed tasks/list operation and observes an explicit task status", async () => {
  const requests = [];
  const client = new ModernMcpClient({ endpoint: "https://mcp.example.test", fetch: async (_input, init) => {
    const body = JSON.parse(init.body);
    requests.push(body);
    return response({ result: { taskId: "task-1", status: "completed", result: { secret: "omit" } } });
  } });
  await assert.rejects(() => client.listTasks(), (error) => error instanceof ModernMcpProtocolError && error.code === "unsupported_method");
  const task = await client.getTask("task-1");
  assert.deepEqual(requests.map(({ method, params }) => ({ method, params })), [
    { method: "tasks/get", params: { taskId: "task-1" } },
  ]);
  assert.deepEqual(task, { taskId: "task-1", status: "completed" });
});

test("modern client rejects malformed task status and unsafe task identifiers", async () => {
  const client = new ModernMcpClient({ endpoint: "https://mcp.example.test", fetch: async () => response({ result: { taskId: "task-1" } }) });
  await assert.rejects(() => client.getTask("task-1"), (error) => error instanceof ModernMcpProtocolError && error.code === "invalid_response");
  await assert.rejects(() => client.getTask("task id"), (error) => error instanceof ModernMcpProtocolError && error.code === "invalid_response");
});
