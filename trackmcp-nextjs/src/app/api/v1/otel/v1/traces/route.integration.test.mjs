import assert from "node:assert/strict";
import test from "node:test";
import { createOtelTracesHandler } from "./handlers.ts";

test("clean customer-like OTLP/HTTP JSON emitter reaches authenticated ingest without retaining raw attributes", async () => {
  let forwarded;
  const ingest = async (request) => {
    forwarded = {
      authorization: request.headers.get("authorization"),
      body: await request.json(),
    };
    return new Response(JSON.stringify({ accepted: forwarded.body.events.length, rejected: 0 }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };
  const handler = createOtelTracesHandler(ingest);
  const response = await handler(new Request("https://trackmcp.test/api/v1/otel/v1/traces", {
    method: "POST",
    headers: {
      authorization: "Bearer tmcp_fixture_key",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      resourceSpans: [{
        resource: { attributes: [{ key: "service.name", value: { stringValue: "orders" } }] },
        scopeSpans: [{ spans: [{
          name: "tools/call",
          startTimeUnixNano: "1700000000000000000",
          attributes: [
            { key: "mcp.tool.name", value: { stringValue: "lookup" } },
            { key: "secret.token", value: { stringValue: "must-not-persist" } },
          ],
        }] }],
      }],
    }),
  }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    accepted: 1,
    rejected: 0,
    otel: { accepted_spans: 1, rejected_spans: 0, protocol: "otlp-http-json", protobuf: "supported_metadata_only" },
  });
  assert.equal(response.headers.get("x-trackmcp-otel-protocol"), "otlp-http-json");
  assert.equal(forwarded.authorization, "Bearer tmcp_fixture_key");
  assert.equal(forwarded.body.events[0].tool_name, "lookup");
  assert.equal(JSON.stringify(forwarded.body).includes("must-not-persist"), false);
  assert.equal(JSON.stringify(forwarded.body).includes("secret.token"), false);
});

test("OTLP route reports spans that are structurally valid but outside the MCP mapping", async () => {
  const handler = createOtelTracesHandler(async (request) => {
    const body = await request.json();
    return Response.json({ accepted: body.events.length, rejected: 0 });
  });
  const response = await handler(new Request("https://trackmcp.test/api/v1/otel/v1/traces", {
    method: "POST",
    headers: { authorization: "Bearer tmcp_fixture_key", "content-type": "application/json" },
    body: JSON.stringify({ resourceSpans: [{ scopeSpans: [{ spans: [
      { name: "tools/call", startTimeUnixNano: "1700000000000000000", attributes: [{ key: "mcp.tool.name", value: { stringValue: "lookup" } }] },
      { name: "", startTimeUnixNano: "1700000000000000000", attributes: [] },
    ] }] }] }),
  }));
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).otel, {
    accepted_spans: 1,
    rejected_spans: 1,
    protocol: "otlp-http-json",
    protobuf: "supported_metadata_only",
  });
});

test("OTLP route rejects malformed unsupported input before calling ingest", async () => {
  let called = false;
  const handler = createOtelTracesHandler(async () => {
    called = true;
    return new Response("unexpected", { status: 500 });
  });
  const response = await handler(new Request("https://trackmcp.test/api/v1/otel/v1/traces", {
    method: "POST",
    headers: { "content-type": "text/plain" },
    body: "protobuf",
  }));
  assert.equal(response.status, 415);
  assert.equal(called, false);
});
