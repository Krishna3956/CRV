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

test("modern catalog pages expose bounded cache hints without inventing freshness guarantees", async () => {
  let method;
  const client = new ModernMcpClient({ endpoint: "https://mcp.example.test", fetch: async (_input, init) => {
    method = init.headers.get("mcp-method");
    const requestId = JSON.parse(init.body).id;
    const key = method === "tools/list" ? "tools" : method === "resources/list" ? "resources" : "prompts";
    return response({ jsonrpc: "2.0", id: requestId, result: {
      [key]: [], ttl_ms: 60_000, cache_scope: "private", nextCursor: "cursor-2",
      secret: "omit",
    } });
  } });
  assert.deepEqual(await client.listTools(), { tools: [], nextCursor: "cursor-2", cacheHints: { ttlMs: 60_000, cacheScope: "private" } });
  assert.equal(method, "tools/list");
  assert.deepEqual(await client.listResources(), { resources: [], nextCursor: "cursor-2", cacheHints: { ttlMs: 60_000, cacheScope: "private" } });
  assert.deepEqual(await client.listPrompts(), { prompts: [], nextCursor: "cursor-2", cacheHints: { ttlMs: 60_000, cacheScope: "private" } });
  const bounded = new ModernMcpClient({ endpoint: "https://mcp.example.test", fetch: async () => response({ result: { tools: [], ttlMs: 999_999_999, cacheScope: "secret" } }) });
  assert.deepEqual(await bounded.listTools(), { tools: [], cacheHints: { ttlMs: 7 * 24 * 60 * 60 * 1000 } });
});

test("modern client invokes tools with task capability and projects task results", async () => {
  const requests = [];
  const client = new ModernMcpClient({ endpoint: "https://mcp.example.test", fetch: async (_input, init) => {
    requests.push({ body: JSON.parse(init.body), mcpName: init.headers.get("mcp-name") });
    return response({ result: { resultType: "task", taskId: "task-call-1", status: "working", createdAt: "2026-10-22T00:00:00Z", result: { secret: "omit" }, private: "omit" } });
  } });
  const result = await client.callTool("lookup", { query: "private input" });
  assert.deepEqual(result, { resultType: "task", task: { taskId: "task-call-1", status: "working", createdAt: "2026-10-22T00:00:00Z" } });
  assert.equal(requests[0].body.method, "tools/call");
  assert.equal(requests[0].mcpName, "lookup");
  assert.deepEqual(requests[0].body.params._meta, { "io.modelcontextprotocol/clientCapabilities": { extensions: { "io.modelcontextprotocol/tasks": {} } } });
  assert.equal(JSON.stringify(result).includes("omit"), false);
  await assert.rejects(() => client.callTool("bad name", {}), (error) => error instanceof ModernMcpProtocolError && error.code === "invalid_response");
});

test("modern client rejects an undeclared server-directed task after discovery", async () => {
  const client = new ModernMcpClient({ endpoint: "https://mcp.example.test", fetch: async (_input, init) => {
    const body = JSON.parse(init.body);
    return body.method === "server/discover"
      ? response({ result: { capabilities: { tools: {} } } })
      : response({ result: { resultType: "task", taskId: "undeclared", status: "working" } });
  } });
  await client.discover();
  await assert.rejects(() => client.callTool("lookup"), (error) => error instanceof ModernMcpProtocolError && error.code === "unsupported_method");
});

test("modern client accepts a server-directed task when discovery advertises tasks", async () => {
  const client = new ModernMcpClient({ endpoint: "https://mcp.example.test", fetch: async (_input, init) => {
    const body = JSON.parse(init.body);
    return body.method === "server/discover"
      ? response({ result: { capabilities: { tools: {}, extensions: { "io.modelcontextprotocol/tasks": {} } } } })
      : response({ result: { resultType: "task", taskId: "declared", status: "working" } });
  } });
  const discovery = await client.discover();
  assert.deepEqual(discovery.capabilityNames, ["tools", "extensions", "io.modelcontextprotocol/tasks"]);
  assert.deepEqual(await client.callTool("lookup"), { resultType: "task", task: { taskId: "declared", status: "working" } });
});

test("modern client does not issue unadvertised catalog methods after discovery", async () => {
  const methods = [];
  const client = new ModernMcpClient({ endpoint: "https://mcp.example.test", fetch: async (_input, init) => {
    const body = JSON.parse(init.body);
    methods.push(body.method);
    return body.method === "server/discover"
      ? response({ result: { capabilities: { tools: {} } } })
      : response({ result: { tools: [] } });
  } });
  await client.discover();
  await client.listTools();
  await assert.rejects(() => client.listResources(), (error) => error instanceof ModernMcpProtocolError && error.code === "unsupported_method");
  await assert.rejects(() => client.listResourceTemplates(), (error) => error instanceof ModernMcpProtocolError && error.code === "unsupported_method");
  await assert.rejects(() => client.listPrompts(), (error) => error instanceof ModernMcpProtocolError && error.code === "unsupported_method");
  assert.deepEqual(methods, ["server/discover", "tools/list"]);
});

test("modern client does not issue unadvertised catalog entity reads after discovery", async () => {
  const methods = [];
  const client = new ModernMcpClient({ endpoint: "https://mcp.example.test", fetch: async (_input, init) => {
    const body = JSON.parse(init.body);
    methods.push(body.method);
    return response({ result: { capabilities: { tools: {} } } });
  } });
  await client.discover();
  await assert.rejects(() => client.readResource("file:///private/config"), (error) => error instanceof ModernMcpProtocolError && error.code === "unsupported_method");
  await assert.rejects(() => client.getPrompt("summarize"), (error) => error instanceof ModernMcpProtocolError && error.code === "unsupported_method");
  assert.deepEqual(methods, ["server/discover"]);
});

test("modern client does not issue unadvertised tool calls or completions after discovery", async () => {
  const methods = [];
  const client = new ModernMcpClient({ endpoint: "https://mcp.example.test", fetch: async (_input, init) => {
    const body = JSON.parse(init.body);
    methods.push(body.method);
    return response({ result: { capabilities: { resources: {} } } });
  } });
  await client.discover();
  await assert.rejects(() => client.callTool("lookup"), (error) => error instanceof ModernMcpProtocolError && error.code === "unsupported_method");
  await assert.rejects(() => client.complete({ type: "ref/prompt", name: "summarize" }, { name: "format", value: "j" }), (error) => error instanceof ModernMcpProtocolError && error.code === "unsupported_method");
  assert.deepEqual(methods, ["server/discover"]);
});

test("modern client does not issue unadvertised task lifecycle methods after discovery", async () => {
  const methods = [];
  const client = new ModernMcpClient({ endpoint: "https://mcp.example.test", fetch: async (_input, init) => {
    const body = JSON.parse(init.body);
    methods.push(body.method);
    return response({ result: { capabilities: { tools: {} } } });
  } });
  await client.discover();
  await assert.rejects(() => client.getTask("task-1"), (error) => error instanceof ModernMcpProtocolError && error.code === "unsupported_method");
  await assert.rejects(() => client.updateTask("task-1", { answer: "ok" }), (error) => error instanceof ModernMcpProtocolError && error.code === "unsupported_method");
  await assert.rejects(() => client.cancelTask("task-1"), (error) => error instanceof ModernMcpProtocolError && error.code === "unsupported_method");
  await assert.rejects(() => client.listenForTaskUpdates(["task-1"]), (error) => error instanceof ModernMcpProtocolError && error.code === "unsupported_method");
  assert.deepEqual(methods, ["server/discover"]);
});

test("modern client does not issue unadvertised catalog subscriptions after discovery", async () => {
  const methods = [];
  const client = new ModernMcpClient({ endpoint: "https://mcp.example.test", fetch: async (_input, init) => {
    const body = JSON.parse(init.body);
    methods.push(body.method);
    return response({ result: { capabilities: { tools: {} } } });
  } });
  await client.discover();
  await assert.rejects(() => client.listenForUpdates({ resourcesListChanged: true }), (error) => error instanceof ModernMcpProtocolError && error.code === "unsupported_method");
  await assert.rejects(() => client.listenForUpdates({ promptsListChanged: true }), (error) => error instanceof ModernMcpProtocolError && error.code === "unsupported_method");
  assert.deepEqual(methods, ["server/discover"]);
});

test("modern client projects complete tool result metadata without payloads", async () => {
  const client = new ModernMcpClient({ endpoint: "https://mcp.example.test", fetch: async () => response({ result: { resultType: "complete", isError: false, content: [{ text: "omit" }], inputRequests: { ask: { params: { secret: "omit" } } } } }) });
  assert.deepEqual(await client.callTool("lookup"), { resultType: "complete", isError: false, contentItemCount: 1, inputRequestKeys: ["ask"] });
});

test("modern client fails closed on non-serializable tool arguments", async () => {
  const client = new ModernMcpClient({ endpoint: "https://mcp.example.test", fetch: async () => response({ result: {} }) });
  const cyclic = {}; cyclic.self = cyclic;
  await assert.rejects(() => client.callTool("lookup", cyclic), (error) => error instanceof ModernMcpProtocolError && error.code === "invalid_response");
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

test("modern client requests completion and returns metadata without suggestions", async () => {
  let request;
  const client = new ModernMcpClient({ endpoint: "https://mcp.example.test", fetch: async (_input, init) => {
    request = init;
    return response({ result: { completion: { values: ["private-one", "private-two"], total: 7, hasMore: true, secret: "omit" } } });
  } });
  const result = await client.complete({ type: "ref/prompt", name: "summarize" }, { name: "format", value: "mar" });
  assert.equal(request.headers.get("mcp-method"), "completion/complete");
  assert.deepEqual(JSON.parse(request.body).params, {
    ref: { type: "ref/prompt", name: "summarize" },
    argument: { name: "format", value: "mar" },
  });
  assert.deepEqual(result, { valueCount: 2, total: 7, hasMore: true });
  assert.equal(JSON.stringify(result).includes("private"), false);
});

test("modern client bounds completion references, arguments, and response envelopes", async () => {
  const client = new ModernMcpClient({ endpoint: "https://mcp.example.test", fetch: async () => response({ result: { completion: { values: [] } } }) });
  await assert.rejects(() => client.complete({ type: "ref/prompt", name: "bad name" }, { name: "format", value: "x" }), (error) => error instanceof ModernMcpProtocolError && error.code === "invalid_response");
  await assert.rejects(() => client.complete({ type: "ref/resource", uri: "file:///safe" }, { name: "format", value: "x\u0000" }), (error) => error instanceof ModernMcpProtocolError && error.code === "invalid_response");
  const malformed = new ModernMcpClient({ endpoint: "https://mcp.example.test", fetch: async () => response({ result: { completion: { values: "not-an-array" } } }) });
  await assert.rejects(() => malformed.complete({ type: "ref/resource", uri: "file:///safe" }, { name: "format", value: "x" }), (error) => error instanceof ModernMcpProtocolError && error.code === "invalid_response");
});

test("modern client lists bounded resource templates without expanding or dereferencing them", async () => {
  const requests = [];
  const client = new ModernMcpClient({ endpoint: "https://mcp.example.test", fetch: async (_input, init) => {
    const body = JSON.parse(init.body);
    requests.push(body);
    return response({ result: { resourceTemplates: [{ uriTemplate: "file:///reports/{id}", name: "report", description: "Report template", mimeType: "text/plain" }, { uriTemplate: "\u0000bad" }], nextCursor: "template-2" } });
  } });
  const page = await client.listResourceTemplates("template-1");
  assert.equal(requests[0].method, "resources/templates/list");
  assert.deepEqual(requests[0].params, { cursor: "template-1" });
  assert.deepEqual(page, { resourceTemplates: [{ uriTemplate: "file:///reports/{id}", name: "report", description: "Report template", mimeType: "text/plain" }], nextCursor: "template-2" });
  assert.equal(JSON.stringify(page).includes("secret"), false);
});

test("modern client follows resource-template cursors and stops on a repeated cursor", async () => {
  let requests = 0;
  const client = new ModernMcpClient({ endpoint: "https://mcp.example.test", fetch: async (_input, init) => {
    requests += 1;
    const cursor = JSON.parse(init.body).params.cursor;
    return response({ result: { resourceTemplates: [{ uriTemplate: `file:///reports/${requests}/{id}` }], nextCursor: cursor ? "same" : "same" } });
  } });
  assert.deepEqual(await client.listAllResourceTemplates(), { items: [{ uriTemplate: "file:///reports/1/{id}" }, { uriTemplate: "file:///reports/2/{id}" }], truncated: true });
  assert.equal(requests, 2);
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

test("modern client reads resources and prompts without returning content", async () => {
  const requests = [];
  const client = new ModernMcpClient({ endpoint: "https://mcp.example.test", fetch: async (_input, init) => {
    const body = JSON.parse(init.body);
    requests.push(body);
    if (body.method === "resources/read") return response({ result: { contents: [{ text: "private resource body" }], isError: false, private: "omit" } });
    return response({ result: { messages: [{ role: "user", content: { type: "text", text: "private prompt" } }], isError: false, private: "omit" } });
  } });
  const resource = await client.readResource("file:///private/config");
  const prompt = await client.getPrompt("summarize", { query: "private input" });
  assert.equal(resource.resourceUriHash.length, 64);
  assert.deepEqual(resource.contentItemCount, 1);
  assert.deepEqual(prompt.messageCount, 1);
  assert.equal(prompt.promptNameHash.length, 64);
  assert.equal(JSON.stringify({ resource, prompt }).includes("private"), false);
  assert.deepEqual(requests.map(({ method, params }) => ({ method, params })), [
    { method: "resources/read", params: { uri: "file:///private/config" } },
    { method: "prompts/get", params: { name: "summarize", arguments: { query: "private input" } } },
  ]);
});

test("modern client rejects unsafe resource and prompt reads", async () => {
  const client = new ModernMcpClient({ endpoint: "https://mcp.example.test", fetch: async () => response({ result: { contents: [], messages: [] } }) });
  await assert.rejects(() => client.readResource(""), (error) => error instanceof ModernMcpProtocolError && error.code === "invalid_response");
  await assert.rejects(() => client.getPrompt("bad name"), (error) => error instanceof ModernMcpProtocolError && error.code === "invalid_response");
  await assert.rejects(() => client.getPrompt("summarize", { "bad key!": true }), (error) => error instanceof ModernMcpProtocolError && error.code === "invalid_response");
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
    { method: "tasks/get", params: { taskId: "task-1", _meta: { "io.modelcontextprotocol/clientCapabilities": { extensions: { "io.modelcontextprotocol/tasks": {} } } } } },
  ]);
  assert.deepEqual(task, { taskId: "task-1", status: "completed" });
});

test("modern client rejects malformed task status and unsafe task identifiers", async () => {
  const client = new ModernMcpClient({ endpoint: "https://mcp.example.test", fetch: async () => response({ result: { taskId: "task-1" } }) });
  await assert.rejects(() => client.getTask("task-1"), (error) => error instanceof ModernMcpProtocolError && error.code === "invalid_response");
  await assert.rejects(() => client.getTask("task id"), (error) => error instanceof ModernMcpProtocolError && error.code === "invalid_response");
});

test("modern client keeps bounded task lifecycle metadata and rejects unknown states", async () => {
  const client = new ModernMcpClient({ endpoint: "https://mcp.example.test", fetch: async () => response({ result: {
    taskId: "task-1", status: "working", statusMessage: "still running", createdAt: "2026-10-22T00:00:00Z", lastUpdatedAt: "2026-10-22T00:00:01Z", result: { secret: "omit" }, error: { detail: "omit" }, private: "omit",
  } }) });
  assert.deepEqual(await client.getTask("task-1"), {
    taskId: "task-1", status: "working", statusMessage: "still running", createdAt: "2026-10-22T00:00:00Z", lastUpdatedAt: "2026-10-22T00:00:01Z",
  });
  const invalid = new ModernMcpClient({ endpoint: "https://mcp.example.test", fetch: async () => response({ result: { taskId: "task-1", status: "unknown" } }) });
  await assert.rejects(() => invalid.getTask("task-1"), (error) => error instanceof ModernMcpProtocolError && error.code === "invalid_response");
});

test("modern client updates and cancels tasks with routing headers and no task/list request", async () => {
  const requests = [];
  const client = new ModernMcpClient({ endpoint: "https://mcp.example.test", fetch: async (_input, init) => {
    requests.push({ headers: init.headers, body: JSON.parse(init.body) });
    return response({ result: {} });
  } });
  await client.updateTask("task-1", { name: { action: "accept", content: { input: "Luca" } } });
  await client.cancelTask("task-1");
  assert.deepEqual(requests.map(({ headers, body }) => ({ method: body.method, params: body.params, mcpName: headers.get("mcp-name") })), [
    { method: "tasks/update", params: { taskId: "task-1", inputResponses: { name: { action: "accept", content: { input: "Luca" } } }, _meta: { "io.modelcontextprotocol/clientCapabilities": { extensions: { "io.modelcontextprotocol/tasks": {} } } } }, mcpName: "task-1" },
    { method: "tasks/cancel", params: { taskId: "task-1", _meta: { "io.modelcontextprotocol/clientCapabilities": { extensions: { "io.modelcontextprotocol/tasks": {} } } } }, mcpName: "task-1" },
  ]);
});

test("modern client polls bounded task status and stops at an explicit terminal state", async () => {
  let calls = 0;
  const client = new ModernMcpClient({ endpoint: "https://mcp.example.test", fetch: async () => {
    calls += 1;
    return response({ result: { taskId: "task-1", status: calls === 1 ? "working" : "completed", pollIntervalMs: 0, inputRequests: { secret: { method: "elicitation/create", params: { message: "omit" } } } } });
  } });
  const result = await client.waitForTask("task-1", { maxPolls: 4, maxWaitMs: 1_000 });
  assert.equal(result.complete, true);
  assert.equal(result.timedOut, false);
  assert.equal(result.polls, 2);
  assert.deepEqual(result.task, { taskId: "task-1", status: "completed", pollIntervalMs: 0, inputRequestKeys: ["secret"] });
  assert.equal(calls, 2);
});

test("modern client projects terminal task result metadata without returning result content", async () => {
  const client = new ModernMcpClient({ endpoint: "https://mcp.example.test", fetch: async () => response({ result: {
    taskId: "task-1",
    status: "completed",
    result: {
      resultType: "complete",
      isError: true,
      content: [{ text: "private result" }, { data: "private bytes" }],
      inputRequests: { follow_up: { params: { secret: "omit" } } },
    },
    secret: "omit",
  } }) });
  const task = await client.getTask("task-1");
  assert.deepEqual(task, {
    taskId: "task-1",
    status: "completed",
    resultType: "complete",
    resultIsError: true,
    resultContentItemCount: 2,
    resultInputRequestKeys: ["follow_up"],
  });
  assert.equal(JSON.stringify(task).includes("private result"), false);
  assert.equal(JSON.stringify(task).includes("private bytes"), false);
});

test("modern client waitForTask is abortable before another request", async () => {
  const controller = new AbortController();
  controller.abort();
  let calls = 0;
  const client = new ModernMcpClient({ endpoint: "https://mcp.example.test", fetch: async () => { calls += 1; return response({ result: { taskId: "task-1", status: "working", pollIntervalMs: 1000 } }); } });
  const result = await client.waitForTask("task-1", { signal: controller.signal });
  assert.equal(result.timedOut, true);
  assert.equal(result.polls, 1);
  assert.equal(calls, 1);
});

test("modern client listens to bounded task notifications without retaining payloads", async () => {
  let request;
  const seen = [];
  const stream = new ReadableStream({ start(controller) {
    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ jsonrpc: "2.0", method: "notifications/subscriptions/acknowledged", params: { private: "omit" } })}\n\n`));
    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ jsonrpc: "2.0", method: "notifications/tasks", params: { taskId: "task-1", status: "working", inputRequests: { secret: { params: { value: "omit" } } } } })}\n\n`));
    controller.close();
  } });
  const client = new ModernMcpClient({ endpoint: "https://mcp.example.test", fetch: async (_input, init) => { request = init; return new Response(stream, { status: 200, headers: { "content-type": "text/event-stream" } }); } });
  const result = await client.listenForTaskUpdates(["task-1"], { onTask: (task) => seen.push(task) });
  assert.deepEqual(result, { events: [{ taskId: "task-1", status: "working", inputRequestKeys: ["secret"] }], truncated: false });
  assert.deepEqual(seen, result.events);
  assert.equal(request.headers.get("mcp-method"), "subscriptions/listen");
  assert.deepEqual(JSON.parse(request.body).params, { notifications: { taskIds: ["task-1"] }, _meta: { "io.modelcontextprotocol/clientCapabilities": { extensions: { "io.modelcontextprotocol/tasks": {} } } } });
  assert.equal(JSON.stringify(result).includes("omit"), false);
});

test("modern client bounds task notification streams and rejects unsafe filters", async () => {
  let requestBody;
  const client = new ModernMcpClient({ endpoint: "https://mcp.example.test", fetch: async (_input, init) => { requestBody = JSON.parse(init.body); return new Response(new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ method: "notifications/tasks", params: { taskId: "task-1", status: "working" } })}\n\n`.repeat(3))); controller.close(); } }), { status: 200, headers: { "content-type": "text/event-stream" } }); } });
  const result = await client.listenForTaskUpdates(["task-1"], { maxEvents: 2 });
  assert.equal(result.events.length, 2);
  assert.equal(result.truncated, true);
  await client.listenForTaskUpdates(["task-1", "task-1"]);
  assert.deepEqual(requestBody.params.notifications.taskIds, ["task-1"]);
  await assert.rejects(() => client.listenForTaskUpdates(["task id"]), (error) => error instanceof ModernMcpProtocolError && error.code === "invalid_response");
});

test("modern client can opt into bounded task-stream reconnects", async () => {
  let calls = 0;
  const client = new ModernMcpClient({ endpoint: "https://mcp.example.test", fetch: async () => {
    calls += 1;
    if (calls === 1) throw new TypeError("socket closed");
    return new Response(new ReadableStream({ start(controller) {
      controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ method: "notifications/tasks", params: { taskId: "task-1", status: "completed" } })}\n\n`));
      controller.close();
    } }), { status: 200, headers: { "content-type": "text/event-stream" } });
  } });
  const result = await client.listenForTaskUpdatesWithReconnect(["task-1"], { maxAttempts: 3, backoffMs: 0 });
  assert.equal(calls, 2);
  assert.equal(result.attempts, 2);
  assert.equal(result.reconnects, 1);
  assert.deepEqual(result.events, [{ taskId: "task-1", status: "completed" }]);
});

test("modern client listens to bounded catalog/resource changes without retaining URIs", async () => {
  let request;
  const client = new ModernMcpClient({ endpoint: "https://mcp.example.test", fetch: async (_input, init) => {
    request = init;
    return sseResponse([
      { jsonrpc: "2.0", method: "notifications/subscriptions/acknowledged", params: { notifications: { toolsListChanged: true, resourceSubscriptions: ["file:///private/config"] }, subscriptionId: "omit" } },
      { jsonrpc: "2.0", method: "notifications/tools/list_changed", params: { private: "omit" } },
      { jsonrpc: "2.0", method: "notifications/resources/updated", params: { uri: "file:///private/config", private: "omit" } },
      { jsonrpc: "2.0", id: 1, result: {} },
    ]);
  } });
  const result = await client.listenForUpdates({ toolsListChanged: true, resourceSubscriptions: ["file:///private/config"] });
  assert.deepEqual(JSON.parse(request.body).params.notifications, { toolsListChanged: true, resourceSubscriptions: ["file:///private/config"] });
  assert.equal(result.honored.toolsListChanged, true);
  assert.equal(result.honored.resourceSubscriptionHashes.length, 1);
  assert.equal(result.events[0].type, "tools_list_changed");
  assert.equal(result.events[1].type, "resource_updated");
  assert.equal(result.events[1].resourceUriHash?.length, 64);
  assert.equal(JSON.stringify(result).includes("private/config"), false);
  assert.equal(result.graceful, true);
  await assert.rejects(() => client.listenForUpdates({}), (error) => error instanceof ModernMcpProtocolError && error.code === "invalid_response");
});

test("modern client can opt into bounded stream reconnects without replay ownership", async () => {
  let calls = 0;
  const client = new ModernMcpClient({ endpoint: "https://mcp.example.test", fetch: async () => {
    calls += 1;
    if (calls === 1) throw new TypeError("socket closed");
    return new Response(new ReadableStream({ start(controller) {
      controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ method: "notifications/tools/list_changed" })}\n\n`));
      controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ jsonrpc: "2.0", id: 1, result: {} })}\n\n`));
      controller.close();
    } }), { status: 200, headers: { "content-type": "text/event-stream" } });
  } });
  const result = await client.listenForUpdatesWithReconnect({ toolsListChanged: true }, { maxAttempts: 3, backoffMs: 0 });
  assert.equal(calls, 2);
  assert.equal(result.attempts, 2);
  assert.equal(result.reconnects, 1);
  assert.equal(result.graceful, true);
  assert.deepEqual(result.events, [{ type: "tools_list_changed" }]);
});

test("modern client bounds task update keys and request size", async () => {
  const client = new ModernMcpClient({ endpoint: "https://mcp.example.test", fetch: async () => response({ result: {} }) });
  await assert.rejects(() => client.updateTask("task-1", { "bad key!": true }), (error) => error instanceof ModernMcpProtocolError && error.code === "invalid_response");
  await assert.rejects(() => client.updateTask("task-1", { answer: "x".repeat(70_000) }), (error) => error instanceof ModernMcpProtocolError && error.code === "request_too_large");
  await assert.rejects(() => client.cancelTask("task id"), (error) => error instanceof ModernMcpProtocolError && error.code === "invalid_response");
});
