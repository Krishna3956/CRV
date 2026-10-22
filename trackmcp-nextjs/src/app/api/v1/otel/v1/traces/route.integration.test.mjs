import assert from "node:assert/strict";
import test from "node:test";
import { createOtelTracesHandler } from "./handlers.ts";

const encoder = new TextEncoder();
function varint(value) {
  let current = BigInt(value);
  const output = [];
  do {
    const next = Number(current & 0x7fn);
    current >>= 7n;
    output.push(next | (current ? 0x80 : 0));
  } while (current);
  return output;
}
function field(number, wire, value) {
  const bytes = Array.isArray(value) ? value : varint(value);
  return [...varint((BigInt(number) << 3n) | BigInt(wire)), ...(wire === 2 ? [...varint(bytes.length), ...bytes] : bytes)];
}
function message(...fields) { return Uint8Array.from(fields.flat()); }
function stringField(number, value) { return field(number, 2, [...encoder.encode(value)]); }
function nestedField(number, value) { return field(number, 2, [...value]); }
function sampleProtobufBatch() {
  const service = message(stringField(1, "service.name"), nestedField(2, message(stringField(1, "orders"))));
  const method = message(stringField(1, "mcp.method.name"), nestedField(2, message(stringField(1, "tools/call"))));
  const secret = message(stringField(1, "secret.token"), nestedField(2, message(stringField(1, "must-not-persist"))));
  const span = message(stringField(5, "tools/call"), field(7, 0, 1700000000000000000n), field(8, 0, 1700000000100000000n), nestedField(9, method), nestedField(9, secret));
  const scope = message(nestedField(2, span));
  const resource = message(nestedField(1, service));
  const resourceSpans = message(nestedField(1, resource), nestedField(2, scope));
  return message(nestedField(1, resourceSpans));
}

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

test("OTLP/HTTP protobuf reaches authenticated ingest with bounded metadata mapping", async () => {
  let forwarded;
  const ingest = async (request) => {
    forwarded = { authorization: request.headers.get("authorization"), body: await request.json() };
    return Response.json({ accepted: forwarded.body.events.length, rejected: 0 });
  };
  const handler = createOtelTracesHandler(ingest);
  const response = await handler(new Request("https://trackmcp.test/api/v1/otel/v1/traces", {
    method: "POST",
    headers: { authorization: "Bearer tmcp_fixture_key", "content-type": "application/x-protobuf" },
    body: sampleProtobufBatch(),
  }));
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).otel, {
    accepted_spans: 1,
    rejected_spans: 0,
    protocol: "otlp-http-protobuf",
    protobuf: "supported_metadata_only",
  });
  assert.equal(response.headers.get("x-trackmcp-otel-protocol"), "otlp-http-protobuf");
  assert.equal(forwarded.authorization, "Bearer tmcp_fixture_key");
  assert.equal(forwarded.body.events[0].tool_name, undefined);
  assert.equal(forwarded.body.events[0].mcp_method, "tools/call");
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
