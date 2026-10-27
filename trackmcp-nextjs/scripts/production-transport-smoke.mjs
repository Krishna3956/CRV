#!/usr/bin/env node

/**
 * Opt-in production transport smoke. A local MCP fixture exercises the official
 * Streamable HTTP and SSE client transports; the TrackMCP adapter sends only
 * bounded metadata observations to the supplied production ingest origin.
 * No fixture payload, event id, API key, or response body is written to the
 * report. The smoke does not claim transport-owned reconnect or replay.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import http from "node:http";
import process from "node:process";
import { Client } from "../packages/typescript-sdk/node_modules/@modelcontextprotocol/sdk/dist/esm/client/index.js";
import { StreamableHTTPClientTransport } from "../packages/typescript-sdk/node_modules/@modelcontextprotocol/sdk/dist/esm/client/streamableHttp.js";
import { SSEClientTransport } from "../packages/typescript-sdk/node_modules/@modelcontextprotocol/sdk/dist/esm/client/sse.js";
import { TrackMCPClientAdapter } from "../packages/typescript-sdk/dist/client-adapter.js";

const confirmation = "I_UNDERSTAND_TRANSPORT_SMOKE";
const baseUrl = process.env.TRACKMCP_TRANSPORT_SMOKE_BASE_URL || "";
const apiKey = process.env.TRACKMCP_TRANSPORT_SMOKE_KEY || "";
const reportPath = process.env.TRACKMCP_TRANSPORT_SMOKE_REPORT || "/tmp/trackmcp-transport-smoke.json";
const servicePrefix = process.env.TRACKMCP_TRANSPORT_SMOKE_SERVICE || "pilot-transport-smoke";

function fail(message) { throw new Error(message); }

function validate() {
  if (process.env.TRACKMCP_TRANSPORT_SMOKE_CONFIRM !== confirmation) fail(`Refusing to run. Set TRACKMCP_TRANSPORT_SMOKE_CONFIRM=${confirmation} explicitly.`);
  if (!baseUrl || !apiKey) fail("TRACKMCP_TRANSPORT_SMOKE_BASE_URL and TRACKMCP_TRANSPORT_SMOKE_KEY are required.");
  let parsed;
  try { parsed = new URL(baseUrl); } catch { fail("TRACKMCP_TRANSPORT_SMOKE_BASE_URL must be an absolute URL."); }
  const trustedHost = parsed.hostname === "trackmcp.com" || parsed.hostname === "app.trackmcp.com" || parsed.hostname.endsWith(".awsapprunner.com");
  if (parsed.protocol !== "https:" || !trustedHost || parsed.username || parsed.password || parsed.search || parsed.hash) fail("Base URL must be a trusted HTTPS origin without credentials, query, or fragment.");
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(servicePrefix)) fail("Service prefix is outside the bounded format.");
}

function listen(server) {
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(`http://127.0.0.1:${server.address().port}`)));
}

function close(server) { return new Promise((resolve) => server.close(() => resolve())); }

function diagnosticSummary(adapter) {
  const diagnostics = adapter.getDiagnostics();
  return {
    dropped_events: diagnostics.droppedEvents,
    hook_errors: diagnostics.hookErrors,
    privacy_errors: diagnostics.privacyErrors,
    queued_events: diagnostics.queuedEvents,
    queued_bytes: diagnostics.queuedBytes,
  };
}

async function runStreamable() {
  const methods = [];
  const server = http.createServer((request, response) => {
    let body = "";
    request.on("data", (chunk) => { body += chunk; });
    request.on("end", () => {
      let message = {};
      try { message = JSON.parse(body); } catch { /* client will classify malformed response */ }
      methods.push(typeof message.method === "string" ? message.method : "unknown");
      const result = message.method === "initialize"
        ? { protocolVersion: "2025-06-18", capabilities: { tools: {} }, serverInfo: { name: "transport-smoke", version: "1" } }
        : message.method === "tools/list"
          ? { tools: [{ name: "lookup", inputSchema: { type: "object" } }] }
          : { content: [{ type: "text", text: "fixture-result-not-retained" }] };
      response.writeHead(200, { "content-type": "application/json", "mcp-session-id": "fixture-session" });
      response.end(JSON.stringify({ jsonrpc: "2.0", id: message.id, result }));
    });
  });
  const endpoint = await listen(server);
  const adapter = new TrackMCPClientAdapter({ apiKey, service: `${servicePrefix}-streamable`, environment: "production", endpoint: `${baseUrl.replace(/\/$/, "")}/api/v1/ingest`, transport: "streamable_http", flushIntervalMs: 60_000 });
  const client = new Client({ name: "trackmcp-transport-smoke", version: "1" });
  try {
    await client.connect(adapter.wrapTransport(new StreamableHTTPClientTransport(new URL(endpoint))));
    await client.listTools();
    await client.callTool({ name: "lookup", arguments: { private_fixture_value: "omit" } });
    await client.close();
    await adapter.flush();
    return { label: "Streamable HTTP adapter", methods: methods.filter((method) => method !== "notifications/initialized"), diagnostics: diagnosticSummary(adapter) };
  } finally {
    await client.close().catch(() => {});
    await close(server);
  }
}

async function runSse() {
  const methods = [];
  let stream;
  const server = http.createServer((request, response) => {
    if (request.method === "GET" && request.url === "/sse") {
      stream = response;
      response.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache", connection: "keep-alive" });
      response.write("event: endpoint\ndata: /messages\n\n");
      return;
    }
    if (request.method === "POST" && request.url === "/messages") {
      let body = "";
      request.on("data", (chunk) => { body += chunk; });
      request.on("end", () => {
        let message = {};
        try { message = JSON.parse(body); } catch { /* bounded client failure */ }
        methods.push(typeof message.method === "string" ? message.method : "unknown");
        response.writeHead(202);
        response.end();
        if (message.method === "initialize" && stream) {
          stream.write(`data: ${JSON.stringify({ jsonrpc: "2.0", id: message.id, result: { protocolVersion: "2025-06-18", capabilities: {}, serverInfo: { name: "transport-smoke", version: "1" } } })}\n\n`);
        }
      });
      return;
    }
    response.writeHead(404);
    response.end();
  });
  const endpoint = await listen(server);
  const adapter = new TrackMCPClientAdapter({ apiKey, service: `${servicePrefix}-sse`, environment: "production", endpoint: `${baseUrl.replace(/\/$/, "")}/api/v1/ingest`, transport: "sse", flushIntervalMs: 60_000 });
  const transport = adapter.wrapTransport(new SSEClientTransport(new URL(`${endpoint}/sse`)));
  transport.onerror = () => {};
  transport.onclose = () => {};
  try {
    await transport.start();
    await transport.send({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "transport-smoke", version: "1" } } });
    await transport.send({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "lookup", arguments: { private_fixture_value: "omit" } } });
    await new Promise((resolve) => setTimeout(resolve, 100));
    stream?.destroy();
    await new Promise((resolve) => setTimeout(resolve, 250));
    await adapter.flush();
    return { label: "SSE adapter", methods, diagnostics: diagnosticSummary(adapter) };
  } finally {
    await transport.close().catch(() => {});
    await close(server);
  }
}

async function main() {
  validate();
  const checks = [await runStreamable(), await runSse()];
  const report = {
    outcome: "passed",
    generated_at: new Date().toISOString(),
    base_url: new URL(baseUrl).origin,
    checks: checks.map(({ label, methods, diagnostics }) => ({ label, methods, diagnostics })),
    caveats: [
      "The local fixtures prove adapter-to-ingest telemetry interoperability, not a customer-owned MCP server contract.",
      "The smoke does not claim transport-owned reconnect, replay, durable subscriptions, or OAuth token exchange.",
      "Reports contain no API key, event id, request body, response body, session id, or customer payload.",
    ],
  };
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
  console.log(`Production transport smoke passed: ${checks.length} transport checks. Redacted report: ${reportPath}`);
}

main().catch(async (error) => {
  const message = error instanceof Error ? error.message : "unknown error";
  console.error(`Production transport smoke failed: ${message}`);
  try { await mkdir(dirname(reportPath), { recursive: true }); await writeFile(reportPath, `${JSON.stringify({ outcome: "failed", generated_at: new Date().toISOString(), base_url: (() => { try { return new URL(baseUrl).origin; } catch { return null; } })(), failure: message, checks: [], caveats: ["Failure evidence is redacted; no credentials or payloads are persisted."] }, null, 2)}\n`, { mode: 0o600 }); } catch { /* preserve failure */ }
  process.exitCode = 1;
});
