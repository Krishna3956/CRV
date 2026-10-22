import type { OTelSpanLike } from "./otel.ts";
import { OTEL_JSON_MAX_SPANS } from "./otel-http.ts";

/** OTLP/HTTP protobuf is bounded to the same span count as the JSON adapter. */
export const OTEL_PROTOBUF_MAX_BYTES = 256 * 1024;

type RecordValue = Record<string, unknown>;
type ParsedProtobufBatch = { spans: OTelSpanLike[]; service?: string; environment?: string };

const MAX_STRING = 2048;
const MAX_DEPTH = 8;

function boundedString(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, MAX_STRING) : undefined;
}

/**
 * Minimal wire reader for the OTLP messages needed by the TrackMCP metadata
 * boundary. It intentionally decodes only resource attributes, span names,
 * timestamps, span attributes, and status. Unknown fields are skipped and
 * never copied into the event envelope.
 */
class WireReader {
  private readonly bytes: Uint8Array;
  private offset = 0;

  constructor(bytes: Uint8Array) { this.bytes = bytes; }

  get done(): boolean { return this.offset >= this.bytes.length; }

  private byte(): number {
    if (this.done) throw new Error("truncated protobuf");
    return this.bytes[this.offset++];
  }

  varint(): bigint {
    let value = BigInt(0);
    for (let shift = BigInt(0); shift <= BigInt(63); shift += BigInt(7)) {
      const byte = this.byte();
      value |= BigInt(byte & 0x7f) << shift;
      if ((byte & 0x80) === 0) return value;
    }
    throw new Error("protobuf varint exceeds 64 bits");
  }

  field(): { number: number; wire: number } {
    const key = this.varint();
    return { number: Number(key >> BigInt(3)), wire: Number(key & BigInt(7)) };
  }

  bytesField(length: number): Uint8Array {
    if (!Number.isSafeInteger(length) || length < 0 || length > this.bytes.length - this.offset) throw new Error("invalid protobuf length");
    const value = this.bytes.slice(this.offset, this.offset + length);
    this.offset += length;
    return value;
  }

  message(): Uint8Array { return this.bytesField(Number(this.varint())); }

  string(): string {
    return new TextDecoder("utf-8", { fatal: false }).decode(this.message()).slice(0, MAX_STRING);
  }

  skip(wire: number): void {
    if (wire === 0) { this.varint(); return; }
    if (wire === 1) { this.bytesField(8); return; }
    if (wire === 2) { this.message(); return; }
    if (wire === 5) { this.bytesField(4); return; }
    throw new Error("unsupported protobuf wire type");
  }
}

function asNumber(value: bigint): number | undefined {
  const result = Number(value);
  return Number.isSafeInteger(result) ? result : undefined;
}

function anyValue(bytes: Uint8Array, depth = 0): unknown {
  if (depth > MAX_DEPTH) return undefined;
  const reader = new WireReader(bytes);
  while (!reader.done) {
    const field = reader.field();
    if (field.wire === 2 && field.number === 1) return reader.string();
    if (field.wire === 0 && field.number === 2) return reader.varint() !== BigInt(0);
    if (field.wire === 0 && field.number === 3) return asNumber(reader.varint());
    if (field.wire === 1 && field.number === 4) { reader.bytesField(8); return undefined; }
    if (field.wire === 2 && field.number === 5) { reader.message(); return undefined; }
    if (field.wire === 2 && field.number === 6) { reader.message(); return undefined; }
    if (field.wire === 2 && field.number === 7) { reader.message(); return undefined; }
    reader.skip(field.wire);
  }
  return undefined;
}

function keyValue(bytes: Uint8Array): { key?: string; value?: unknown } {
  const reader = new WireReader(bytes);
  let key: string | undefined;
  let value: unknown;
  while (!reader.done) {
    const field = reader.field();
    if (field.number === 1 && field.wire === 2) key = boundedString(reader.string());
    else if (field.number === 2 && field.wire === 2) value = anyValue(reader.message());
    else reader.skip(field.wire);
  }
  return { key, value };
}

function attributes(bytesList: Uint8Array[]): RecordValue {
  const output: RecordValue = {};
  for (const bytes of bytesList) {
    const row = keyValue(bytes);
    if (row.key && row.value !== undefined && !Object.prototype.hasOwnProperty.call(output, row.key)) output[row.key] = row.value;
  }
  return output;
}

function resource(bytes: Uint8Array): RecordValue {
  const reader = new WireReader(bytes);
  const rows: Uint8Array[] = [];
  while (!reader.done) {
    const field = reader.field();
    if (field.number === 1 && field.wire === 2) rows.push(reader.message());
    else reader.skip(field.wire);
  }
  return attributes(rows);
}

function status(bytes: Uint8Array): RecordValue {
  const reader = new WireReader(bytes);
  const output: RecordValue = {};
  while (!reader.done) {
    const field = reader.field();
    if (field.number === 2 && field.wire === 0) output.code = asNumber(reader.varint());
    else if (field.number === 1 && field.wire === 2) output.message = reader.string();
    else reader.skip(field.wire);
  }
  return output;
}

function span(bytes: Uint8Array): OTelSpanLike {
  const reader = new WireReader(bytes);
  const attrs: Uint8Array[] = [];
  const output: OTelSpanLike = {};
  while (!reader.done) {
    const field = reader.field();
    if (field.number === 5 && field.wire === 2) output.name = reader.string();
    else if (field.number === 7 && field.wire === 0) output.startTimeUnixNano = reader.varint().toString();
    else if (field.number === 8 && field.wire === 0) output.endTimeUnixNano = reader.varint().toString();
    else if (field.number === 9 && field.wire === 2) attrs.push(reader.message());
    else if (field.number === 15 && field.wire === 2) output.status = status(reader.message());
    else reader.skip(field.wire);
  }
  output.attributes = attributes(attrs);
  return output;
}

function scopeSpans(bytes: Uint8Array, spans: OTelSpanLike[]): void {
  const reader = new WireReader(bytes);
  while (!reader.done) {
    const field = reader.field();
    if (field.number === 2 && field.wire === 2) {
      if (spans.length < OTEL_JSON_MAX_SPANS) spans.push(span(reader.message()));
      else reader.message();
    } else reader.skip(field.wire);
  }
}

function resourceSpans(bytes: Uint8Array, result: ParsedProtobufBatch): void {
  const reader = new WireReader(bytes);
  while (!reader.done) {
    const field = reader.field();
    if (field.number === 1 && field.wire === 2) {
      const attrs = resource(reader.message());
      if (!result.service && typeof attrs["service.name"] === "string") result.service = String(attrs["service.name"]).slice(0, 128);
      if (!result.environment && typeof attrs["deployment.environment.name"] === "string") result.environment = String(attrs["deployment.environment.name"]).slice(0, 64);
    } else if (field.number === 2 && field.wire === 2) scopeSpans(reader.message(), result.spans);
    else reader.skip(field.wire);
  }
}

export function parseOtelProtobufBatch(input: Uint8Array): ParsedProtobufBatch | { error: string } {
  if (input.byteLength > OTEL_PROTOBUF_MAX_BYTES) return { error: `request exceeds ${OTEL_PROTOBUF_MAX_BYTES} bytes` };
  const result: ParsedProtobufBatch = { spans: [] };
  try {
    const reader = new WireReader(input);
    while (!reader.done) {
      const field = reader.field();
      if (field.number === 1 && field.wire === 2) resourceSpans(reader.message(), result);
      else reader.skip(field.wire);
    }
  } catch {
    return { error: "Invalid OTLP protobuf." };
  }
  if (!result.spans.length) return { error: "resource_spans contains no spans" };
  return result;
}
