import type { OTelSpanLike } from "./otel.ts";

export const OTEL_JSON_MAX_BYTES = 256 * 1024;
export const OTEL_JSON_MAX_SPANS = 100;

type JsonRecord = Record<string, unknown>;

function record(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};
}

function stringValue(value: unknown): string | undefined {
  const item = record(value);
  const candidate = item.stringValue ?? item.string_value ?? item.value;
  return typeof candidate === "string" && candidate.trim() ? candidate.trim().slice(0, 2048) : undefined;
}

export function otelAttributes(value: unknown): Record<string, unknown> {
  const input = record(value);
  if (!Array.isArray(input.attributes)) return input;
  const output: Record<string, unknown> = {};
  for (const item of input.attributes) {
    const row = record(item);
    if (typeof row.key !== "string" || !row.key || Object.prototype.hasOwnProperty.call(output, row.key)) continue;
    const attr = record(row.value);
    output[row.key] = attr.stringValue ?? attr.string_value ?? attr.boolValue ?? attr.bool_value ?? attr.intValue ?? attr.int_value ?? attr.doubleValue ?? attr.double_value ?? stringValue(row.value);
  }
  return output;
}

export type OTelJsonBatch = {
  spans: OTelSpanLike[];
  service?: string;
  environment?: string;
};

export function parseOtelJsonBatch(value: unknown): OTelJsonBatch | { error: string } {
  const root = record(value);
  if (!Array.isArray(root.resourceSpans)) return { error: "resourceSpans must be an array" };
  const spans: OTelSpanLike[] = [];
  let service: string | undefined;
  let environment: string | undefined;
  for (const resourceSpan of root.resourceSpans) {
    const resource = record(resourceSpan).resource;
    const resourceAttrs = otelAttributes(resource);
    service ||= typeof resourceAttrs["service.name"] === "string" ? String(resourceAttrs["service.name"]).slice(0, 128) : undefined;
    environment ||= typeof resourceAttrs["deployment.environment.name"] === "string" ? String(resourceAttrs["deployment.environment.name"]).slice(0, 64) : undefined;
    const scopes = record(resourceSpan).scopeSpans ?? record(resourceSpan).scope_spans;
    if (!Array.isArray(scopes)) continue;
    for (const scope of scopes) {
      const rawSpans = record(scope).spans;
      if (!Array.isArray(rawSpans)) continue;
      for (const raw of rawSpans) {
        if (spans.length >= OTEL_JSON_MAX_SPANS) return { spans, service, environment };
        const span = record(raw);
        spans.push({
          name: span.name,
          startTimeUnixNano: span.startTimeUnixNano ?? span.start_time_unix_nano,
          endTimeUnixNano: span.endTimeUnixNano ?? span.end_time_unix_nano,
          attributes: otelAttributes(span),
          status: record(span.status),
        });
      }
    }
  }
  if (!spans.length) return { error: "resourceSpans contains no spans" };
  return { spans, service, environment };
}
