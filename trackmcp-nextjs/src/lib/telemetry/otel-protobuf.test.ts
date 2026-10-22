import assert from "node:assert/strict";
import test from "node:test";
import { parseOtelProtobufBatch, OTEL_PROTOBUF_MAX_BYTES } from "./otel-protobuf.ts";

const encoder = new TextEncoder();
function varint(value: bigint | number): number[] {
  let current = BigInt(value);
  const output: number[] = [];
  do { const next = Number(current & 0x7fn); current >>= 7n; output.push(next | (current ? 0x80 : 0)); } while (current);
  return output;
}
function field(number: number, wire: number, value: number[] | bigint): number[] {
  const bytes = Array.isArray(value) ? value : varint(value);
  return [...varint((BigInt(number) << 3n) | BigInt(wire)), ...(wire === 2 ? [...varint(bytes.length), ...bytes] : bytes)];
}
function message(...fields: number[][]): Uint8Array { return Uint8Array.from(fields.flat()); }
function stringField(number: number, value: string): number[] { return field(number, 2, [...encoder.encode(value)]); }
function nestedField(number: number, value: Uint8Array): number[] { return field(number, 2, [...value]); }

function sampleBatch(): Uint8Array {
  const service = message(stringField(1, "service.name"), nestedField(2, message(stringField(1, "checkout"))));
  const environment = message(stringField(1, "deployment.environment.name"), nestedField(2, message(stringField(1, "production"))));
  const resource = message(nestedField(1, service), nestedField(1, environment));
  const method = message(stringField(1, "mcp.method.name"), nestedField(2, message(stringField(1, "tools/call"))));
  const transport = message(stringField(1, "mcp.transport"), nestedField(2, message(stringField(1, "streamable_http"))));
  const span = message(stringField(5, "tools/call"), field(7, 0, 1_700_000_000_000_000_000n), field(8, 0, 1_700_000_000_100_000_000n), nestedField(9, method), nestedField(9, transport));
  const scope = message(nestedField(2, span));
  const resourceSpans = message(nestedField(1, resource), nestedField(2, scope));
  return message(nestedField(1, resourceSpans));
}

test("parses bounded OTLP protobuf metadata without retaining payloads", () => {
  const parsed = parseOtelProtobufBatch(sampleBatch());
  assert.ok(!("error" in parsed));
  assert.equal(parsed.service, "checkout");
  assert.equal(parsed.environment, "production");
  assert.equal(parsed.spans.length, 1);
  assert.equal(parsed.spans[0].name, "tools/call");
  assert.equal((parsed.spans[0].attributes as Record<string, unknown>)["mcp.transport"], "streamable_http");
});

test("rejects oversized protobuf envelopes and malformed wire data", () => {
  assert.deepEqual(parseOtelProtobufBatch(new Uint8Array(OTEL_PROTOBUF_MAX_BYTES + 1)), { error: `request exceeds ${OTEL_PROTOBUF_MAX_BYTES} bytes` });
  assert.deepEqual(parseOtelProtobufBatch(Uint8Array.from([0x0a, 0x05, 0xff])), { error: "Invalid OTLP protobuf." });
});
