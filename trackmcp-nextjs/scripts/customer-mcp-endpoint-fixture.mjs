#!/usr/bin/env node

/**
 * Controlled external MCP endpoint fixture for operator UAT.
 *
 * It intentionally exposes only deterministic metadata and bounded synthetic
 * catalog entries. It does not persist request bodies, credentials, or tool
 * arguments. The bearer token is supplied only at runtime.
 */
import { createServer } from "node:http";
import process from "node:process";

const port = Number(process.env.CUSTOMER_MCP_ENDPOINT_PORT || process.env.PORT || 8787);
const bindHost = process.env.CUSTOMER_MCP_ENDPOINT_BIND || "127.0.0.1";
const authToken = process.env.CUSTOMER_MCP_ENDPOINT_AUTH_TOKEN || "";

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

function body(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    request.on("error", reject);
  });
}

function send(response, id, result) {
  response.writeHead(200, {
    "content-type": "application/json",
    "mcp-session-id": "customer-fixture-session",
  });
  response.end(JSON.stringify({ jsonrpc: "2.0", id, result }));
}

function catalogTools() {
  return tools.map((name, index) => ({
    name,
    description: `Controlled customer operation ${index + 1}`,
    inputSchema: { type: "object", properties: { query: { type: "string" }, id: { type: "string" } } },
  }));
}

const server = createServer(async (request, response) => {
  if (request.url === "/.well-known/oauth-protected-resource/mcp" || request.url === "/.well-known/oauth-protected-resource") {
    const origin = `https://${request.headers.host}`;
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ resource: `${origin}/mcp`, authorization_servers: [origin], scopes_supported: ["mcp:read", "mcp:write"] }));
    return;
  }
  if (request.url !== "/mcp" || request.method !== "POST") {
    response.writeHead(404);
    response.end();
    return;
  }
  if (authToken && request.headers.authorization !== `Bearer ${authToken}`) {
    response.writeHead(401, { "content-type": "application/json" });
    response.end(JSON.stringify({ error: "unauthorized" }));
    return;
  }
  let message;
  try { message = JSON.parse(await body(request)); } catch {
    response.writeHead(400);
    response.end();
    return;
  }
  const method = message?.method;
  if (method === "notifications/initialized" || method === "notifications/cancelled") {
    response.writeHead(202);
    response.end();
    return;
  }
  const result = method === "initialize"
    ? { protocolVersion: message?.params?.protocolVersion || "2025-06-18", capabilities: { tools: {}, resources: {}, prompts: {}, completions: {} }, serverInfo: { name: "customer-owned-uat-fixture", version: "2026.10.30" } }
    : method === "tools/list" ? { tools: catalogTools() }
      : method === "resources/list" ? { resources: resources.map(([uri, name, mimeType]) => ({ uri, name, mimeType })) }
        : method === "resources/templates/list" ? { resourceTemplates: resourceTemplates.map(([uriTemplate, name]) => ({ uriTemplate, name, mimeType: "application/json" })) }
          : method === "prompts/list" ? { prompts: prompts.map(([name, description, args]) => ({ name, description, arguments: args.map((arg) => ({ name: arg })) })) }
            : method === "completion/complete" ? { completion: { values: ["match-one", "match-two"], total: 2, hasMore: false } }
              : null;
  if (!result) {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ jsonrpc: "2.0", id: message?.id ?? null, error: { code: -32601, message: "Method not found" } }));
    return;
  }
  send(response, message.id, result);
});

server.listen(port, bindHost, () => {
  console.log(`customer MCP fixture listening on ${port}`);
});

process.on("SIGTERM", () => server.close(() => process.exit(0)));
process.on("SIGINT", () => server.close(() => process.exit(0)));
