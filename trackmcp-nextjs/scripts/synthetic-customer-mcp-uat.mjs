#!/usr/bin/env node

/**
 * Synthetic customer MCP UAT.
 *
 * This is deliberately local and deterministic. It behaves like a customer
 * Streamable HTTP server with a broad catalog, then drives the official MCP
 * client through the TrackMCP client adapter. It proves the client/telemetry
 * path without claiming interoperability with a real customer deployment.
 */
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdir, writeFile } from "node:fs/promises";
import { once } from "node:events";
import { dirname, join } from "node:path";
import process from "node:process";
import { Client } from "../packages/typescript-sdk/node_modules/@modelcontextprotocol/sdk/dist/esm/client/index.js";
import { StreamableHTTPClientTransport } from "../packages/typescript-sdk/node_modules/@modelcontextprotocol/sdk/dist/esm/client/streamableHttp.js";
import { TrackMCPClientAdapter } from "../packages/typescript-sdk/dist/client-adapter.js";

const confirmation = "I_UNDERSTAND_SYNTHETIC_CUSTOMER_MCP_UAT";
const apiKey = "tmcp_synthetic_fixture_key";
const authToken = "synthetic-customer-token";
const appRoot = process.cwd();
const reportPath = process.env.SYNTHETIC_CUSTOMER_MCP_UAT_REPORT || join(appRoot, "../docs/evidence/synthetic-customer-mcp-uat-2026-10-30.json");

const tools = [
  "search_catalog", "get_order", "create_order", "update_order", "cancel_order",
  "list_customers", "get_customer", "create_customer", "update_customer", "archive_customer",
  "list_invoices", "get_invoice", "create_invoice", "refund_invoice", "list_projects",
  "get_project", "create_project", "update_project", "list_runs", "get_run",
  "cancel_run", "trigger_sync", "get_sync_status", "list_alerts", "ack_alert",
  "list_users", "get_user", "invite_user", "list_documents", "search_documents",
];

const resources = [
  ["customer://acme/profile", "customer profile", "application/json"],
  ["customer://acme/plan", "customer plan", "application/json"],
  ["customer://acme/invoices/2026-10", "monthly invoices", "application/json"],
  ["system://runbook", "operations runbook", "text/markdown"],
  ["system://openapi", "API contract", "application/json"],
  ["metrics://summary", "metrics summary", "application/json"],
];

const resourceTemplates = [
  ["customer://{customerId}/orders/{orderId}", "order by customer and ID"],
  ["customer://{customerId}/documents/{documentId}", "document by customer and ID"],
  ["runs://{runId}/logs", "run logs by ID"],
];

const prompts = [
  ["investigate_order", "Investigate a customer order", ["orderId"]],
  ["summarize_account", "Summarize an account", ["customerId", "format"]],
  ["incident_review", "Review an incident", ["incidentId"]],
  ["migration_plan", "Plan a migration", ["system", "target"]],
  ["support_reply", "Draft a support reply", ["tone", "issue"]],
];

function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    request.on("error", reject);
  });
}

function response(id, result) {
  return JSON.stringify({ jsonrpc: "2.0", id, result });
}

function toolDefinitions() {
  return tools.map((name, index) => ({
    name,
    description: `Synthetic customer operation ${index + 1}: ${name.replaceAll("_", " ")}`,
    inputSchema: {
      type: "object",
      properties: { query: { type: "string" }, id: { type: "string" }, limit: { type: "integer" } },
      additionalProperties: true,
    },
  }));
}

function toolResult(name, args) {
  if (!tools.includes(name)) return { isError: true, content: [{ type: "text", text: "unknown synthetic tool" }] };
  return {
    content: [{
      type: "text",
      // Deliberately includes sensitive-looking input; the adapter must not
      // retain this in telemetry.
      text: JSON.stringify({ tool: name, accepted: true, request: args, secret: "synthetic-secret-must-not-persist" }),
    }],
    structuredContent: { ok: true, tool: name, recordCount: 3 },
  };
}

async function startSyntheticServer() {
  const calls = [];
  const ingested = [];
  const server = createServer(async (request, reply) => {
    const body = await readBody(request);
    if (request.url === "/api/v1/ingest" && request.method === "POST") {
      if (request.headers.authorization !== `Bearer ${apiKey}`) {
        reply.writeHead(401, { "content-type": "application/json" });
        reply.end(JSON.stringify({ error: "unauthorized" }));
        return;
      }
      const payload = JSON.parse(body);
      ingested.push(payload);
      reply.writeHead(202, { "content-type": "application/json" });
      reply.end(JSON.stringify({ accepted: payload.events?.length || 0, rejected: 0 }));
      return;
    }
    if (request.url === "/.well-known/oauth-protected-resource/mcp" || request.url === "/.well-known/oauth-protected-resource") {
      const address = server.address();
      const origin = `http://127.0.0.1:${address.port}`;
      reply.writeHead(200, { "content-type": "application/json" });
      reply.end(JSON.stringify({ resource: `${origin}/mcp`, authorization_servers: [origin], scopes_supported: ["mcp:read", "mcp:write"] }));
      return;
    }
    if (request.url !== "/mcp" || request.method !== "POST") {
      reply.writeHead(404);
      reply.end();
      return;
    }
    if (request.headers.authorization !== `Bearer ${authToken}`) {
      reply.writeHead(401, { "content-type": "application/json" });
      reply.end(JSON.stringify({ error: "unauthorized" }));
      return;
    }
    const message = JSON.parse(body);
    const method = message?.method;
    if (method === "notifications/initialized") {
      reply.writeHead(202);
      reply.end();
      return;
    }
    if (method === "notifications/cancelled") {
      reply.writeHead(202);
      reply.end();
      return;
    }
    const result = method === "initialize"
      ? {
        protocolVersion: message?.params?.protocolVersion || "2025-06-18",
        capabilities: { tools: {}, resources: { subscribe: true }, prompts: {}, completions: {} },
        serverInfo: { name: "synthetic-customer-mcp", version: "2026.10.30" },
      }
      : method === "tools/list"
        ? { tools: toolDefinitions(), cacheHints: { ttlMs: 30_000, cacheScope: "private" } }
        : method === "resources/list"
          ? { resources: resources.map(([uri, name, mimeType]) => ({ uri, name, mimeType })) }
          : method === "resources/templates/list"
            ? { resourceTemplates: resourceTemplates.map(([uriTemplate, name]) => ({ uriTemplate, name, mimeType: "application/json" })) }
            : method === "prompts/list"
              ? { prompts: prompts.map(([name, description, args]) => ({ name, description, arguments: args.map((arg) => ({ name: arg })) })) }
              : method === "tools/call"
                ? (calls.push({ method, name: message?.params?.name }), toolResult(message?.params?.name, message?.params?.arguments))
                : method === "resources/read"
                  ? { contents: [{ uri: message?.params?.uri, mimeType: "application/json", text: JSON.stringify({ uri: message?.params?.uri, customer: "acme", privateToken: "secret-resource-value" }) }] }
                  : method === "prompts/get"
                    ? { description: "Synthetic prompt response", messages: [{ role: "user", content: { type: "text", text: JSON.stringify({ prompt: message?.params?.name, args: message?.params?.arguments, secret: "secret-prompt-value" }) } }] }
                    : method === "completion/complete"
                      ? { completion: { values: ["match-one", "match-two", "match-three"], total: 3, hasMore: false } }
                      : null;
    if (!result) {
      reply.writeHead(200, { "content-type": "application/json" });
      reply.end(JSON.stringify({ jsonrpc: "2.0", id: message?.id ?? null, error: { code: -32601, message: "Method not found" } }));
      return;
    }
    reply.writeHead(200, { "content-type": "application/json", "mcp-session-id": "synthetic-customer-session" });
    reply.end(response(message.id, result));
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address === "object");
  return { server, origin: `http://127.0.0.1:${address.port}`, calls, ingested };
}

function summarize(events) {
  const byMethod = {};
  const byType = {};
  for (const event of events) {
    if (event.mcp_method) byMethod[event.mcp_method] = (byMethod[event.mcp_method] || 0) + 1;
    byType[event.event_type] = (byType[event.event_type] || 0) + 1;
  }
  return { total: events.length, byType, byMethod };
}

async function main() {
  if (process.env.SYNTHETIC_CUSTOMER_MCP_UAT_CONFIRM !== confirmation) {
    throw new Error(`Set SYNTHETIC_CUSTOMER_MCP_UAT_CONFIRM=${confirmation} to run this controlled fixture.`);
  }
  const fixture = await startSyntheticServer();
  const events = [];
  const adapter = new TrackMCPClientAdapter({
    apiKey,
    endpoint: `${fixture.origin}/api/v1/ingest`,
    service: "synthetic-customer-mcp",
    environment: "uat",
    transport: "streamable_http",
    flushIntervalMs: 60_000,
    onEvent: (event) => events.push(event),
  });
  const transport = new StreamableHTTPClientTransport(new URL(`${fixture.origin}/mcp`), {
    requestInit: { headers: { authorization: `Bearer ${authToken}` } },
  });
  const client = new Client({ name: "synthetic-customer-host", version: "2026.10.30" }, { capabilities: { roots: {}, sampling: {} } });
  try {
    await client.connect(adapter.wrapTransport(transport));
    const listedTools = await client.listTools();
    const listedResources = await client.listResources();
    const listedTemplates = await client.listResourceTemplates();
    const listedPrompts = await client.listPrompts();
    assert.equal(listedTools.tools.length, 30);
    assert.equal(listedResources.resources.length, 6);
    assert.equal(listedTemplates.resourceTemplates.length, 3);
    assert.equal(listedPrompts.prompts.length, 5);

    for (const [index, tool] of listedTools.tools.entries()) {
      const result = await client.callTool({ name: tool.name, arguments: { id: `record-${index}`, query: "customer-safe synthetic test", secret: "secret-call-argument" } });
      assert.equal(result.isError, undefined);
    }
    for (const [index, [uri]] of resources.entries()) {
      const result = await client.readResource({ uri });
      assert.equal(result.contents.length, 1);
      assert.equal(result.contents[0].uri, uri);
      assert.equal(index < resources.length, true);
    }
    for (const [name] of prompts) {
      const result = await client.getPrompt({ name, arguments: { customerId: "acme", secret: "secret-prompt-argument" } });
      assert.equal(result.messages.length, 1);
    }
    const completion = await client.complete({ ref: { type: "ref/prompt", name: "summarize_account" }, argument: { name: "format", value: "json" } });
    assert.equal(completion.completion.values.length, 3);
    await client.close();
    await adapter.flush();

    const delivered = fixture.ingested.flatMap((batch) => batch.events || []);
    assert.ok(delivered.length >= 70, `expected broad telemetry delivery, got ${delivered.length}`);
    assert.equal(JSON.stringify(delivered).includes("secret-call-argument"), false);
    assert.equal(JSON.stringify(delivered).includes("secret-resource-value"), false);
    assert.equal(JSON.stringify(delivered).includes("secret-prompt-value"), false);
    assert.equal(JSON.stringify(delivered).includes(authToken), false);
    assert.equal(JSON.stringify(delivered).includes(apiKey), false);
    assert.equal(adapter.getDiagnostics().pending_request_count, 0);

    const report = {
      outcome: "passed",
      evidence_class: "synthetic_customer_fixture_uat",
      generated_at: new Date().toISOString(),
      target: "local synthetic customer MCP server",
      transport: "streamable_http",
      protocol_version: "2025-06-18",
      catalog: { tools: listedTools.tools.length, resources: listedResources.resources.length, resource_templates: listedTemplates.resourceTemplates.length, prompts: listedPrompts.prompts.length },
      exercised: { tool_calls: fixture.calls.length, resource_reads: resources.length, prompt_gets: prompts.length, completions: 1 },
      telemetry: { delivered_events: delivered.length, summary: summarize(delivered), diagnostics: adapter.getDiagnostics(), sensitive_values_retained: false },
      caveats: [
        "This validates the TrackMCP client/telemetry path against a deterministic synthetic customer server.",
        "It does not replace a real customer-owned endpoint UAT or release-owner approval.",
        "Tool arguments, resource contents, prompt messages, and credentials were not retained in telemetry.",
      ],
    };
    await mkdir(dirname(reportPath), { recursive: true });
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
    console.log(JSON.stringify({ report: reportPath, ...report }, null, 2));
  } finally {
    await fixture.server.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exitCode = 1;
});
