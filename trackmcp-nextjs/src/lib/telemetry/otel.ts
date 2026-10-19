import { randomUUID } from "node:crypto";
import type { TrackMCPEvent, TrackMCPTransport } from "./types.ts";

/**
 * The smallest OTel span shape needed at the TrackMCP boundary.  This is
 * intentionally structural so applications do not need to install an OTel
 * package just to use the mapper (and so OTel SDK objects can be adapted
 * without serialising the whole span).
 */
export type OTelSpanLike = {
  name?: unknown;
  startTimeUnixNano?: unknown;
  endTimeUnixNano?: unknown;
  startTime?: unknown;
  endTime?: unknown;
  attributes?: unknown;
  status?: unknown;
};

export type OTelMappingResult =
  | { ok: true; event: TrackMCPEvent }
  | { ok: false; reason: "invalid_span" | "missing_start_time" | "unsupported_operation" };

const MAX_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_ATTRIBUTE_LENGTH = 2048;
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/;

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function attribute(attrs: Record<string, unknown>, ...keys: string[]): unknown {
  for (const key of keys) {
    const value = attrs[key];
    if (value !== undefined && value !== null) return value;
  }
  return undefined;
}

function boundedString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() && value.length <= MAX_ATTRIBUTE_LENGTH ? value.trim() : undefined;
}

function unixNano(value: unknown): number | undefined {
  if (typeof value === "bigint") return Number(value) / 1e9;
  if (typeof value === "number" && Number.isFinite(value)) return value > 1e12 ? value / 1e9 : value;
  if (typeof value === "string" && /^\d+$/.test(value)) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed / 1e9 : undefined;
  }
  return undefined;
}

function isoTime(span: OTelSpanLike): string | undefined {
  const seconds = unixNano(span.startTimeUnixNano);
  if (seconds !== undefined && seconds > 0) {
    const value = new Date(seconds * 1000).toISOString();
    return ISO.test(value) ? value : undefined;
  }
  const start = span.startTime;
  if (start instanceof Date && Number.isFinite(start.getTime())) return start.toISOString();
  if (typeof start === "string" && Number.isFinite(Date.parse(start))) return new Date(start).toISOString();
  return undefined;
}

function durationMs(span: OTelSpanLike): number | undefined {
  const start = unixNano(span.startTimeUnixNano) ?? (span.startTime instanceof Date ? span.startTime.getTime() / 1000 : undefined);
  const end = unixNano(span.endTimeUnixNano) ?? (span.endTime instanceof Date ? span.endTime.getTime() / 1000 : undefined);
  if (start === undefined || end === undefined || end < start) return undefined;
  return Math.min(MAX_DURATION_MS, Math.max(0, Math.round((end - start) * 1000)));
}

function operationName(span: OTelSpanLike, attrs: Record<string, unknown>): string | undefined {
  return boundedString(attribute(attrs, "mcp.method.name", "mcp.method", "gen_ai.operation.name")) || boundedString(span.name);
}

function transport(value: unknown): TrackMCPTransport | undefined {
  const normalized = boundedString(value)?.toLowerCase().replace(/[- ]/g, "_");
  if (normalized === "stdio" || normalized === "streamable_http" || normalized === "sse") return normalized;
  return normalized ? "custom" : undefined;
}

function statusSuccess(span: OTelSpanLike, attrs: Record<string, unknown>): boolean | undefined {
  const status = record(span.status);
  const code = attribute(status, "code") ?? attribute(attrs, "otel.status_code", "status.code");
  if (typeof code === "string") {
    if (code.toUpperCase() === "ERROR") return false;
    if (code.toUpperCase() === "OK") return true;
  }
  if (typeof code === "number") {
    if (code === 2) return false; // OTel SpanStatusCode.ERROR
    if (code === 1) return true; // OTel SpanStatusCode.OK
  }
  if (attribute(attrs, "error.type", "exception.type") !== undefined) return false;
  return undefined;
}

function eventType(method: string | undefined, toolName: string | undefined): TrackMCPEvent["event_type"] {
  if (toolName || method === "tools/call") return "tool_call";
  if (method?.endsWith("/list")) return "catalog";
  if (method === "initialize" || method === "notifications/initialized") return "session";
  return "protocol";
}

/**
 * Convert a single OTel span into TrackMCP's bounded event envelope.
 *
 * This is an interoperability boundary, not an OTLP receiver or exporter:
 * callers remain responsible for obtaining spans and sending the resulting
 * event through the normal SDK ingest path. Full span attributes, messages,
 * trace IDs, and exception bodies are deliberately not copied.
 */
export function mapOTelSpanToTrackMCPEvent(span: OTelSpanLike, options: { service: string; environment?: string; sdkVersion?: string } ): OTelMappingResult {
  if (!span || typeof span !== "object" || !boundedString(options.service)) return { ok: false, reason: "invalid_span" };
  const startedAt = isoTime(span);
  if (!startedAt) return { ok: false, reason: "missing_start_time" };
  const attrs = record(span.attributes);
  const method = operationName(span, attrs);
  if (!method) return { ok: false, reason: "unsupported_operation" };
  const toolName = boundedString(attribute(attrs, "gen_ai.tool.name", "mcp.tool.name", "tool.name"));
  const success = statusSuccess(span, attrs);
  const event: TrackMCPEvent = {
    schema_version: "1",
    event_id: randomUUID(),
    event_type: eventType(method, toolName),
    service: options.service.trim(),
    environment: options.environment || "production",
    sdk_version: options.sdkVersion,
    observation_source: "server",
    transport: transport(attribute(attrs, "mcp.transport", "server.transport")),
    protocol_version: boundedString(attribute(attrs, "mcp.protocol.version", "gen_ai.protocol.version")),
    mcp_method: method,
    request_id: boundedString(attribute(attrs, "mcp.request.id", "rpc.request.id")),
    session_id: boundedString(attribute(attrs, "mcp.session.id", "gen_ai.conversation.id")),
    session_id_source: attribute(attrs, "mcp.session.id") ? "protocol" : "missing",
    client_name: boundedString(attribute(attrs, "mcp.client.name", "gen_ai.agent.name")),
    client_version: boundedString(attribute(attrs, "mcp.client.version")),
    tool_name: toolName,
    started_at: startedAt,
    duration_ms: durationMs(span),
    ...(success === undefined ? {} : { success, is_error: !success }),
    payload_policy: "metadata",
    payload_size_bytes: 0,
  };
  return { ok: true, event };
}
