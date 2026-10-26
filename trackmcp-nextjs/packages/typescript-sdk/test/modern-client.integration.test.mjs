import assert from "node:assert/strict";
import http from "node:http";
import test from "node:test";
import { ModernMcpClient, MODERN_MCP_PROTOCOL_VERSION } from "../dist/modern-client.js";

function startFixture() {
  const requests = [];
  const server = http.createServer((request, response) => {
    let body = "";
    request.on("data", (chunk) => { body += chunk; });
    request.on("end", () => {
      const payload = JSON.parse(body);
      requests.push({ method: payload.method, params: payload.params, headers: request.headers });
      response.statusCode = 200;
      if (payload.method === "subscriptions/listen") {
        response.setHeader("content-type", "text/event-stream");
        response.end([
          `data: ${JSON.stringify({ jsonrpc: "2.0", method: "notifications/subscriptions/acknowledged", params: { ttlMs: 30_000, cacheScope: "private", subscriptionId: "fixture-secret", notifications: { toolsListChanged: true } } })}`,
          `data: ${JSON.stringify({ jsonrpc: "2.0", method: "notifications/tools/list_changed", params: { private: "omit" } })}`,
        ].join("\n\n") + "\n\n");
        return;
      }
      response.setHeader("content-type", "application/json");
      const result = payload.method === "server/discover"
        ? { supportedVersions: [MODERN_MCP_PROTOCOL_VERSION], capabilities: { tools: {}, resources: {} }, serverInfo: { name: "fixture", version: "1" } }
        : { tools: [{ name: "search" }], nextCursor: "opaque-cursor", ttlMs: 30_000, cacheScope: "private" };
      response.end(JSON.stringify({ jsonrpc: "2.0", id: payload.id, result }));
    });
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve({ server, requests, port: server.address().port })));
}

test("modern client interoperates with a real local Streamable HTTP fixture", async (t) => {
  const fixture = await startFixture();
  t.after(() => fixture.server.close());
  const client = new ModernMcpClient({ endpoint: `http://127.0.0.1:${fixture.port}` });
  const discovery = await client.discover();
  assert.equal(discovery.protocolVersion, MODERN_MCP_PROTOCOL_VERSION);
  assert.deepEqual(await client.listTools(), { tools: [{ name: "search" }], nextCursor: "opaque-cursor", cacheHints: { ttlMs: 30_000, cacheScope: "private" } });
  const request = fixture.requests.find((item) => item.method === "tools/list");
  assert.deepEqual(request.params._meta["io.modelcontextprotocol/clientCapabilities"], {});
  assert.equal(request.headers["mcp-protocol-version"], MODERN_MCP_PROTOCOL_VERSION);
});

test("modern client consumes a real subscription stream without retaining its secret", async (t) => {
  const fixture = await startFixture();
  t.after(() => fixture.server.close());
  const client = new ModernMcpClient({ endpoint: `http://127.0.0.1:${fixture.port}` });
  await client.discover();
  const result = await client.listenForUpdates({ toolsListChanged: true });
  assert.deepEqual(result.cacheHints, { ttlMs: 30_000, cacheScope: "private" });
  assert.equal(result.honored.toolsListChanged, true);
  assert.equal(result.events[0].type, "tools_list_changed");
  assert.equal(JSON.stringify(result).includes("fixture-secret"), false);
});
