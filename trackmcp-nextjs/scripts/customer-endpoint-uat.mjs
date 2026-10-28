#!/usr/bin/env node

/**
 * Explicit, operator-run UAT for one customer-owned MCP endpoint.
 *
 * This runner deliberately has no scheduled trigger and never exchanges OAuth
 * tokens, calls tools, or replays events. It uses the official MCP client
 * transports for a bounded initialize/list discovery pass, wraps the transport
 * with the metadata-only TrackMCP adapter, and writes only redacted evidence.
 * It may probe RFC 9728 protected-resource metadata, but never follows an
 * authorization-server URL or registers a client. A bearer token may be
 * supplied by the operator for the endpoint; it is never written to the report
 * or error output.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import process from "node:process";
import { Client } from "../packages/typescript-sdk/node_modules/@modelcontextprotocol/sdk/dist/esm/client/index.js";
import { StreamableHTTPClientTransport } from "../packages/typescript-sdk/node_modules/@modelcontextprotocol/sdk/dist/esm/client/streamableHttp.js";
import { SSEClientTransport } from "../packages/typescript-sdk/node_modules/@modelcontextprotocol/sdk/dist/esm/client/sse.js";
import { TrackMCPClientAdapter } from "../packages/typescript-sdk/dist/client-adapter.js";

const confirmation = "I_UNDERSTAND_CUSTOMER_ENDPOINT_UAT";
const endpointValue = process.env.TRACKMCP_CUSTOMER_ENDPOINT_UAT_URL || "";
const transportName = process.env.TRACKMCP_CUSTOMER_ENDPOINT_UAT_TRANSPORT || "streamable_http";
const protocolVersion = process.env.TRACKMCP_CUSTOMER_ENDPOINT_UAT_PROTOCOL_VERSION || "2025-06-18";
const authToken = process.env.TRACKMCP_CUSTOMER_ENDPOINT_UAT_AUTH_TOKEN || "";
const baseUrl = process.env.TRACKMCP_CUSTOMER_ENDPOINT_UAT_BASE_URL || "";
const apiKey = process.env.TRACKMCP_CUSTOMER_ENDPOINT_UAT_KEY || "";
const servicePrefix = process.env.TRACKMCP_CUSTOMER_ENDPOINT_UAT_SERVICE || "customer-endpoint-uat";
const reportPath = process.env.TRACKMCP_CUSTOMER_ENDPOINT_UAT_REPORT || "/tmp/trackmcp-customer-endpoint-uat.json";
const allowPrivate = process.env.TRACKMCP_CUSTOMER_ENDPOINT_UAT_ALLOW_PRIVATE === "true";
const oauthMetadataLimitBytes = 32 * 1024;

class UatError extends Error {
  constructor(code, message, details) {
    super(message);
    this.name = "UatError";
    this.code = code;
    this.details = details;
  }
}

function fail(code, message, details) {
  throw new UatError(code, message, details);
}

function isPrivateHostname(hostname) {
  const value = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (value === "localhost" || value.endsWith(".local") || value === "::1") return true;
  if (!/^\d+\.\d+\.\d+\.\d+$/.test(value)) return value.includes(":");
  const octets = value.split(".").map(Number);
  const [a, b] = octets;
  return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

function parseEndpoint(value, label) {
  let parsed;
  try { parsed = new URL(value); } catch { fail("invalid_endpoint", `${label} must be an absolute URL.`); }
  const privateTarget = isPrivateHostname(parsed.hostname);
  const localHttpFixture = allowPrivate && privateTarget && parsed.protocol === "http:";
  if ((!localHttpFixture && parsed.protocol !== "https:") || parsed.username || parsed.password || parsed.search || parsed.hash) {
    fail("unsafe_endpoint", `${label} must be HTTPS without credentials, query, or fragment (loopback HTTP is allowed only with the explicit private fixture override).`);
  }
  if (privateTarget && !allowPrivate) {
    fail("private_endpoint", `${label} resolves to a private or local hostname; set the explicit private-target override for a controlled fixture.`);
  }
  return parsed;
}

function parseTrustedBase(value) {
  const parsed = parseEndpoint(value, "TrackMCP base URL");
  const trusted = parsed.hostname === "trackmcp.com" || parsed.hostname === "app.trackmcp.com" || parsed.hostname.endsWith(".awsapprunner.com");
  if (!trusted && !(allowPrivate && isPrivateHostname(parsed.hostname))) fail("untrusted_ingest_origin", "TrackMCP base URL is outside the approved production origin set.");
  return parsed;
}

function validate() {
  if (process.env.TRACKMCP_CUSTOMER_ENDPOINT_UAT_CONFIRM !== confirmation) fail("confirmation_required", `Set TRACKMCP_CUSTOMER_ENDPOINT_UAT_CONFIRM=${confirmation} explicitly.`);
  if (!endpointValue || !baseUrl || !apiKey) fail("configuration_missing", "Endpoint URL, TrackMCP base URL, and TrackMCP API key are required.");
  if (transportName !== "streamable_http" && transportName !== "sse") fail("transport_invalid", "Transport must be streamable_http or sse.");
  if (protocolVersion !== "2025-06-18" && protocolVersion !== "2025-11-25" && protocolVersion !== "2026-07-28") fail("protocol_version_invalid", "Protocol version is outside the reviewed MCP version set.");
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(servicePrefix)) fail("service_invalid", "Service prefix is outside the bounded format.");
  parseEndpoint(endpointValue, "Customer endpoint");
  parseTrustedBase(baseUrl);
}

function headerInit() {
  const headers = {};
  if (authToken) headers.authorization = `Bearer ${authToken}`;
  return headers;
}

function fetchWithAuth(input, init = {}) {
  const headers = new Headers(init.headers);
  for (const [name, value] of Object.entries(headerInit())) headers.set(name, value);
  return fetch(input, { ...init, headers });
}

function buildTransport(endpoint) {
  const requestInit = { headers: headerInit() };
  if (transportName === "streamable_http") {
    return new StreamableHTTPClientTransport(endpoint, {
      requestInit,
      fetch: fetchWithAuth,
      redirectPolicy: "same-origin",
    });
  }
  return new SSEClientTransport(endpoint, {
    requestInit,
    eventSourceInit: { fetch: fetchWithAuth },
    fetch: fetchWithAuth,
    redirectPolicy: "same-origin",
  });
}

function errorCode(error) {
  if (error && typeof error === "object" && "code" in error && (typeof error.code === "number" || typeof error.code === "string")) return String(error.code);
  if (error && typeof error === "object" && "status" in error && typeof error.status === "number") return `http_${error.status}`;
  return "transport_error";
}

function isUnsupported(error) {
  const code = errorCode(error);
  return code === "-32601" || code === "404" || code === "http_404";
}

function protectedResourceMetadataUrl(endpoint, pathAware) {
  if (!pathAware) return new URL("/.well-known/oauth-protected-resource", endpoint.origin);
  const pathname = endpoint.pathname.replace(/^\/+/, "");
  return new URL(`/.well-known/oauth-protected-resource/${pathname}`, endpoint.origin);
}

function comparableResource(value) {
  try {
    const parsed = new URL(value);
    if (parsed.username || parsed.password || parsed.search || parsed.hash) return null;
    return `${parsed.origin}${parsed.pathname.replace(/\/$/, "") || "/"}`;
  } catch {
    return null;
  }
}

async function probeOAuthMetadata(endpoint) {
  const expectedResource = comparableResource(endpoint.href);
  const candidates = [protectedResourceMetadataUrl(endpoint, true), protectedResourceMetadataUrl(endpoint, false)];
  const seen = new Set();
  let notFoundCount = 0;
  let unavailableCount = 0;
  for (const candidate of candidates) {
    const candidateUrl = candidate.toString();
    if (seen.has(candidateUrl)) continue;
    seen.add(candidateUrl);
    try {
      const response = await fetch(candidate, {
        headers: { accept: "application/json" },
        redirect: "manual",
        signal: AbortSignal.timeout(5_000),
      });
      if (response.status === 404 || response.status === 405) {
        notFoundCount += 1;
        continue;
      }
      if (response.status >= 300 && response.status < 400) return { outcome: "unsafe_redirect", candidate_count: seen.size };
      if (!response.ok) {
        unavailableCount += 1;
        continue;
      }
      const body = await response.text();
      if (Buffer.byteLength(body, "utf8") > oauthMetadataLimitBytes) return { outcome: "oversized", candidate_count: seen.size };
      let metadata;
      try { metadata = JSON.parse(body); } catch { return { outcome: "malformed", candidate_count: seen.size }; }
      if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return { outcome: "malformed", candidate_count: seen.size };
      const authorizationServers = Array.isArray(metadata.authorization_servers)
        ? metadata.authorization_servers.filter((value) => typeof value === "string" && value.length <= 2048).slice(0, 4)
        : [];
      const scopes = Array.isArray(metadata.scopes_supported)
        ? metadata.scopes_supported.filter((value) => typeof value === "string").slice(0, 32)
        : [];
      return {
        outcome: "observed",
        candidate_count: seen.size,
        resource_match: comparableResource(metadata.resource) === expectedResource,
        authorization_server_count: authorizationServers.length,
        scopes_supported_count: scopes.length,
        authorization_server_urls_followed: false,
      };
    } catch {
      unavailableCount += 1;
    }
  }
  return {
    outcome: notFoundCount === seen.size && unavailableCount === 0 ? "not_advertised" : "unavailable",
    candidate_count: seen.size,
  };
}

function boundedCount(value) {
  if (Array.isArray(value)) return Math.min(value.length, 1000);
  if (value && typeof value === "object") {
    for (const key of ["tools", "resources", "prompts"]) if (Array.isArray(value[key])) return Math.min(value[key].length, 1000);
  }
  return null;
}

async function probe(label, operation) {
  try {
    const result = await operation();
    return { label, outcome: "observed", item_count: boundedCount(result) };
  } catch (error) {
    if (isUnsupported(error)) return { label, outcome: "unsupported" };
    return { label, outcome: "failed", error_code: errorCode(error) };
  }
}

function diagnostics(adapter, deliveryErrors) {
  const value = adapter.getDiagnostics();
  return {
    dropped_events: value.droppedEvents,
    hook_errors: value.hookErrors,
    privacy_errors: value.privacyErrors,
    queued_events: value.queuedEvents,
    queued_bytes: value.queuedBytes,
    delivery_error_count: deliveryErrors.length,
  };
}

function assertClean(adapter, deliveryErrors) {
  const value = diagnostics(adapter, deliveryErrors);
  if (deliveryErrors.length || value.queued_events !== 0 || value.queued_bytes !== 0) fail("ingest_not_drained", "Metadata-only observations did not drain cleanly.");
  if (value.dropped_events || value.hook_errors || value.privacy_errors) fail("adapter_diagnostics", "Metadata-only adapter diagnostics reported a UAT-invalid condition.");
}

async function writeReport(report) {
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
}

async function main() {
  validate();
  const endpoint = parseEndpoint(endpointValue, "Customer endpoint");
  const ingest = `${baseUrl.replace(/\/$/, "")}/api/v1/ingest`;
  const deliveryErrors = [];
  const adapter = new TrackMCPClientAdapter({
    apiKey,
    service: servicePrefix,
    environment: "production",
    endpoint: ingest,
    transport: transportName,
    flushIntervalMs: 60_000,
    diagnostics: { onDeliveryError: () => { if (deliveryErrors.length < 8) deliveryErrors.push(true); } },
  });
  const client = new Client({ name: "trackmcp-customer-endpoint-uat", version: "1" });
  const transport = buildTransport(endpoint);
  transport.setProtocolVersion?.(protocolVersion);
  let checks = [];
  let oauthMetadata = { outcome: "not_run" };
  try {
    oauthMetadata = await probeOAuthMetadata(endpoint);
    await client.connect(adapter.wrapTransport(transport));
    checks = [
      await probe("tools/list", () => client.listTools()),
      await probe("resources/list", () => client.listResources()),
      await probe("resources/templates/list", () => client.listResourceTemplates()),
      await probe("prompts/list", () => client.listPrompts()),
    ];
    if (checks.some((check) => check.outcome === "failed")) fail("discovery_failed", "At least one MCP discovery operation failed.", checks);
    await client.close();
    await adapter.flush();
    assertClean(adapter, deliveryErrors);
    await writeReport({
      outcome: "passed",
      generated_at: new Date().toISOString(),
      target_origin: endpoint.origin,
      transport: transportName,
      protocol_version: protocolVersion,
      authorization_supplied: Boolean(authToken),
      oauth_metadata: oauthMetadata,
      checks,
      diagnostics: diagnostics(adapter, deliveryErrors),
      caveats: [
        "This is an operator-supplied endpoint UAT, not a claim about every customer server.",
        "The runner only probes protected-resource metadata; it does not follow authorization-server URLs, register clients, exchange or refresh tokens, call tools, replay events, or prove transport-owned reconnect semantics.",
        "Reports contain no endpoint path, token, API key, session identifier, request body, response body, cursor, tool name, resource URI, or prompt name.",
      ],
    });
    console.log(`Customer endpoint UAT passed: ${checks.length} bounded discovery checks. Redacted report: ${reportPath}`);
  } catch (error) {
    await client.close().catch(() => {});
    await adapter.flush().catch(() => {});
    const code = error instanceof UatError ? error.code : "unexpected_error";
    await writeReport({
      outcome: "failed",
      generated_at: new Date().toISOString(),
      target_origin: endpoint.origin,
      transport: transportName,
      protocol_version: protocolVersion,
      authorization_supplied: Boolean(authToken),
      oauth_metadata: oauthMetadata,
      failure_code: code,
      checks: error instanceof UatError && Array.isArray(error.details) ? error.details : checks,
      diagnostics: diagnostics(adapter, deliveryErrors),
      caveats: ["Failure evidence is redacted; no credentials, endpoint paths, or MCP payloads are persisted."],
    });
    console.error(`Customer endpoint UAT failed: ${code}. Redacted report: ${reportPath}`);
    process.exitCode = 1;
  }
}

main().catch(async (error) => {
  const code = error instanceof UatError ? error.code : "unexpected_error";
  await writeReport({ outcome: "failed", generated_at: new Date().toISOString(), failure_code: code, checks: [], caveats: ["Failure evidence is redacted; no credentials or payloads are persisted."] }).catch(() => {});
  console.error(`Customer endpoint UAT failed: ${code}. Redacted report: ${reportPath}`);
  process.exitCode = 1;
});
