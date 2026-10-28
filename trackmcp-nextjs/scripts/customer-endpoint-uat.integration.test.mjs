import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const appRoot = process.cwd();
const runner = join(appRoot, "scripts/customer-endpoint-uat.mjs");

function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    request.on("error", reject);
  });
}

function jsonRpcResponse(id, result) {
  return JSON.stringify({ jsonrpc: "2.0", id, result });
}

async function startFixture() {
  const seenIngest = [];
  const server = createServer(async (request, response) => {
    const body = await readBody(request);
    if (request.url === "/api/v1/ingest" && request.method === "POST") {
      seenIngest.push({ authorization: request.headers.authorization || "", body });
      response.writeHead(202, { "content-type": "application/json" });
      response.end(JSON.stringify({ accepted: true }));
      return;
    }
    if (request.url === "/.well-known/oauth-protected-resource/mcp" || request.url === "/.well-known/oauth-protected-resource") {
      const address = server.address();
      const origin = `http://127.0.0.1:${address.port}`;
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ resource: `${origin}/mcp`, authorization_servers: [origin], scopes_supported: ["mcp:read"] }));
      return;
    }
    if (request.url === "/mcp" && request.method === "DELETE") {
      response.writeHead(204);
      response.end();
      return;
    }
    if (request.url !== "/mcp" || request.method !== "POST") {
      response.writeHead(404);
      response.end();
      return;
    }
    let message;
    try {
      message = JSON.parse(body);
    } catch {
      response.writeHead(400);
      response.end();
      return;
    }
    const method = message?.method;
    if (method === "notifications/initialized") {
      response.writeHead(202);
      response.end();
      return;
    }
    const result = method === "initialize"
      ? {
        protocolVersion: message?.params?.protocolVersion || "2025-06-18",
        capabilities: { tools: {}, resources: {}, prompts: {} },
        serverInfo: { name: "fixture", version: "1" },
      }
      : method === "tools/list"
        ? { tools: [] }
        : method === "resources/list"
          ? { resources: [] }
          : method === "resources/templates/list"
            ? { resourceTemplates: [] }
            : method === "prompts/list"
              ? { prompts: [] }
              : null;
    if (!result) {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ jsonrpc: "2.0", id: message?.id ?? null, error: { code: -32601, message: "Method not found" } }));
      return;
    }
    response.writeHead(200, {
      "content-type": "application/json",
      "mcp-session-id": "fixture-session",
    });
    response.end(jsonRpcResponse(message.id, result));
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address === "object");
  const origin = `http://127.0.0.1:${address.port}`;
  return { server, origin, seenIngest };
}

async function startSseFixture() {
  const seenRequests = [];
  const seenIngest = [];
  let stream;
  const server = createServer(async (request, response) => {
    const authorization = request.headers.authorization || "";
    if (request.url === "/api/v1/ingest" && request.method === "POST") {
      if (authorization !== "Bearer tmcp_fixture_key") {
        response.writeHead(401, { "content-type": "application/json" });
        response.end(JSON.stringify({ error: "unauthorized" }));
        return;
      }
      seenIngest.push({ authorization, body: await readBody(request) });
      response.writeHead(202, { "content-type": "application/json" });
      response.end(JSON.stringify({ accepted: true }));
      return;
    }
    if (request.url === "/.well-known/oauth-protected-resource/sse" || request.url === "/.well-known/oauth-protected-resource") {
      const address = server.address();
      const origin = `http://127.0.0.1:${address.port}`;
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ resource: `${origin}/sse`, authorization_servers: [origin], scopes_supported: ["mcp:read"] }));
      return;
    }
    if (authorization !== "Bearer fixture-token") {
      response.writeHead(401, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "unauthorized" }));
      return;
    }
    if (request.url === "/sse" && request.method === "GET") {
      response.writeHead(200, {
        "cache-control": "no-cache",
        connection: "keep-alive",
        "content-type": "text/event-stream",
      });
      response.flushHeaders?.();
      response.write("event: endpoint\ndata: /message\n\n");
      stream = response;
      return;
    }
    if (request.url === "/message" && request.method === "POST") {
      const body = await readBody(request);
      let message;
      try {
        message = JSON.parse(body);
      } catch {
        response.writeHead(400);
        response.end();
        return;
      }
      seenRequests.push({ authorization, method: message?.method || "" });
      response.writeHead(202);
      response.end();
      if (message?.method === "notifications/initialized") return;
      const method = message?.method;
      const result = method === "initialize"
        ? {
          protocolVersion: message?.params?.protocolVersion || "2025-06-18",
          capabilities: { tools: {}, resources: {}, prompts: {} },
          serverInfo: { name: "sse-fixture", version: "1" },
        }
        : method === "tools/list"
          ? { tools: [] }
          : method === "resources/list"
            ? { resources: [] }
            : method === "resources/templates/list"
              ? { resourceTemplates: [] }
              : method === "prompts/list"
                ? { prompts: [] }
                : null;
      if (!result || !stream) return;
      stream.write(`event: message\ndata: ${jsonRpcResponse(message.id, result)}\n\n`);
      return;
    }
    response.writeHead(404);
    response.end();
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address === "object");
  const origin = `http://127.0.0.1:${address.port}`;
  return {
    server,
    origin,
    seenRequests,
    seenIngest,
    closeStream: () => stream?.end(),
  };
}

function runRunner(env) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [runner], {
      cwd: appRoot,
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"],
    });
    const stdout = [];
    const stderr = [];
    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    child.on("error", reject);
    child.on("close", (code, signal) => resolve({ code, signal, stdout: Buffer.concat(stdout).toString("utf8"), stderr: Buffer.concat(stderr).toString("utf8") }));
  });
}

test("customer endpoint UAT runs the official streamable HTTP discovery path against an explicit loopback fixture", async () => {
  const fixture = await startFixture();
  const report = join(tmpdir(), `trackmcp-customer-endpoint-uat-${process.pid}.json`);
  try {
    const result = await runRunner({
      TRACKMCP_CUSTOMER_ENDPOINT_UAT_CONFIRM: "I_UNDERSTAND_CUSTOMER_ENDPOINT_UAT",
      TRACKMCP_CUSTOMER_ENDPOINT_UAT_URL: `${fixture.origin}/mcp`,
      TRACKMCP_CUSTOMER_ENDPOINT_UAT_TRANSPORT: "streamable_http",
      TRACKMCP_CUSTOMER_ENDPOINT_UAT_PROTOCOL_VERSION: "2025-06-18",
      TRACKMCP_CUSTOMER_ENDPOINT_UAT_BASE_URL: fixture.origin,
      TRACKMCP_CUSTOMER_ENDPOINT_UAT_KEY: "tmcp_fixture_key",
      TRACKMCP_CUSTOMER_ENDPOINT_UAT_AUTH_TOKEN: "fixture-token",
      TRACKMCP_CUSTOMER_ENDPOINT_UAT_ALLOW_PRIVATE: "true",
      TRACKMCP_CUSTOMER_ENDPOINT_UAT_SERVICE: "fixture-uat",
      TRACKMCP_CUSTOMER_ENDPOINT_UAT_REPORT: report,
    });
    assert.equal(result.code, 0, `${result.stdout}\n${result.stderr}`);
    const evidence = JSON.parse(await readFile(report, "utf8"));
    assert.equal(evidence.outcome, "passed");
    assert.deepEqual(evidence.oauth_metadata, {
      outcome: "observed",
      candidate_count: 1,
      resource_match: true,
      authorization_server_count: 1,
      scopes_supported_count: 1,
      authorization_server_urls_followed: false,
    });
    assert.deepEqual(evidence.checks.map(({ label, outcome }) => ({ label, outcome })), [
      { label: "tools/list", outcome: "observed" },
      { label: "resources/list", outcome: "observed" },
      { label: "resources/templates/list", outcome: "observed" },
      { label: "prompts/list", outcome: "observed" },
    ]);
    assert.equal(evidence.diagnostics.queued_events, 0);
    assert.equal(evidence.diagnostics.delivery_error_count, 0);
    assert.equal(fixture.seenIngest.length > 0, true);
    const serialized = JSON.stringify(evidence);
    assert.equal(serialized.includes("fixture-token"), false);
    assert.equal(serialized.includes("tmcp_fixture_key"), false);
    assert.equal(serialized.includes("/mcp"), false);
  } finally {
    await new Promise((resolve) => fixture.server.close(resolve));
  }
});

test("customer endpoint UAT runs the official SSE discovery path against an explicit loopback fixture", async () => {
  const fixture = await startSseFixture();
  const report = join(tmpdir(), `trackmcp-customer-endpoint-uat-sse-${process.pid}.json`);
  try {
    const result = await runRunner({
      TRACKMCP_CUSTOMER_ENDPOINT_UAT_CONFIRM: "I_UNDERSTAND_CUSTOMER_ENDPOINT_UAT",
      TRACKMCP_CUSTOMER_ENDPOINT_UAT_URL: `${fixture.origin}/sse`,
      TRACKMCP_CUSTOMER_ENDPOINT_UAT_TRANSPORT: "sse",
      TRACKMCP_CUSTOMER_ENDPOINT_UAT_PROTOCOL_VERSION: "2025-06-18",
      TRACKMCP_CUSTOMER_ENDPOINT_UAT_BASE_URL: fixture.origin,
      TRACKMCP_CUSTOMER_ENDPOINT_UAT_KEY: "tmcp_fixture_key",
      TRACKMCP_CUSTOMER_ENDPOINT_UAT_AUTH_TOKEN: "fixture-token",
      TRACKMCP_CUSTOMER_ENDPOINT_UAT_ALLOW_PRIVATE: "true",
      TRACKMCP_CUSTOMER_ENDPOINT_UAT_SERVICE: "fixture-sse-uat",
      TRACKMCP_CUSTOMER_ENDPOINT_UAT_REPORT: report,
    });
    assert.equal(result.code, 0, `${result.stdout}\n${result.stderr}`);
    const evidence = JSON.parse(await readFile(report, "utf8"));
    assert.equal(evidence.outcome, "passed");
    assert.equal(evidence.transport, "sse");
    assert.deepEqual(evidence.oauth_metadata, {
      outcome: "observed",
      candidate_count: 1,
      resource_match: true,
      authorization_server_count: 1,
      scopes_supported_count: 1,
      authorization_server_urls_followed: false,
    });
    assert.deepEqual(evidence.checks.map(({ label, outcome }) => ({ label, outcome })), [
      { label: "tools/list", outcome: "observed" },
      { label: "resources/list", outcome: "observed" },
      { label: "resources/templates/list", outcome: "observed" },
      { label: "prompts/list", outcome: "observed" },
    ]);
    assert.equal(evidence.diagnostics.queued_events, 0);
    assert.equal(evidence.diagnostics.delivery_error_count, 0);
    assert.ok(fixture.seenRequests.length >= 5);
    assert.ok(fixture.seenIngest.length > 0);
    assert.ok(fixture.seenIngest.every(({ authorization }) => authorization === "Bearer tmcp_fixture_key"));
    assert.ok(fixture.seenRequests.every(({ authorization }) => authorization === "Bearer fixture-token"));
    const serialized = JSON.stringify(evidence);
    assert.equal(serialized.includes("fixture-token"), false);
    assert.equal(serialized.includes("tmcp_fixture_key"), false);
    assert.equal(serialized.includes("/sse"), false);
  } finally {
    fixture.closeStream();
    await new Promise((resolve) => fixture.server.close(resolve));
  }
});
