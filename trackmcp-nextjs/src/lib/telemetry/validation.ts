import {
  TRACKMCP_LEGACY_SCHEMA_VERSION,
  TRACKMCP_SCHEMA_VERSION,
  type CanonicalTrackMCPEvent,
  type TrackMCPEvent,
  type TrackMCPEventType,
  type TrackMCPCorrelationHandleSource,
  type TrackMCPIntentSource,
  type TrackMCPSessionIdSource,
} from "./types.ts";

export const MAX_BATCH_EVENTS = 100;
export const MAX_REQUEST_BYTES = 1024 * 1024;
export const MAX_EVENT_BYTES = 256 * 1024;
export const MAX_PAYLOAD_BYTES = 128 * 1024;
export const MAX_STRING_LENGTH = 2048;
export const MAX_CORRELATION_HANDLE_BYTES = 128;

const EVENT_TYPES: readonly TrackMCPEventType[] = ["protocol", "tool_call", "session", "catalog", "workflow", "custom"];
const DIRECTIONS = ["client_to_server", "server_to_client"] as const;
const TRANSPORTS = ["stdio", "streamable_http", "sse", "custom"] as const;
const PAYLOAD_POLICIES = ["metadata", "redacted", "full"] as const;
const SESSION_ID_SOURCES = ["protocol", "transport_generated", "external", "missing"] as const;
const CORRELATION_HANDLE_SOURCES = ["external", "issued", "missing"] as const;
const INTENT_SOURCES = ["context_parameter", "external_callback", "fallback", "missing"] as const;
const INGEST_SENSITIVE_KEYS = new Set([
  "password", "passwd", "secret", "token", "api_key", "apikey", "authorization", "cookie",
  "set_cookie", "access_token", "refresh_token", "private_key", "client_secret", "ssn",
  "credit_card", "card_number",
]);
const INGEST_BASE64_THRESHOLD = 128;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EVENT_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/;
const CORRELATION_HANDLE = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const SENSITIVE_INTENT = /(?:bearer\s+|authorization\s*[:=]|api[_-]?key\s*[:=]|access[_-]?token\s*[:=]|refresh[_-]?token\s*[:=]|password\s*[:=]|secret\s*[:=]|eyJ[A-Za-z0-9_-]+\.|https?:\/\/|\b[^\s@]+@[^\s@]+\.[^\s@]+\b)/i;

export type EventValidationResult =
  | { ok: true; event: CanonicalTrackMCPEvent }
  | { ok: false; reason: string; eventId?: string };

export function deduplicateEvents(events: readonly CanonicalTrackMCPEvent[], existingIds: ReadonlySet<string> = new Set()) {
  const seen = new Set<string>();
  const unique: CanonicalTrackMCPEvent[] = [];
  let ignored = 0;
  for (const event of events) {
    if (seen.has(event.event_id) || existingIds.has(event.event_id)) {
      ignored += 1;
      continue;
    }
    seen.add(event.event_id);
    unique.push(event);
  }
  return { events: unique, ignored };
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizedKey(key: string): string {
  return key.replace(/([a-z0-9])([A-Z])/g, "$1_$2").replace(/[\s-]+/g, "_").toLowerCase();
}

function ingestMarker(reason: string, originalType: string, extra: Record<string, unknown> = {}) {
  return { __trackmcp_truncated: true, reason, original_type: originalType, ...extra };
}

function scrubIngestValue(value: unknown, depth = 0, seen = new WeakSet<object>()): unknown {
  if (typeof value === "string") {
    if (/(?:authorization|api[_-]?key|access[_-]?token|refresh[_-]?token|password|secret)\s*[:=]\s*\S+/i.test(value)) return "[redacted]";
    if (/\bbearer\s+[A-Za-z0-9._~+/-]+=*/i.test(value)) return "[redacted]";
    const dataUri = value.match(/^data:([^;,]+)?(?:;base64)?,/i);
    if (dataUri) return ingestMarker("binary", "string", { media_type: dataUri[1] || "application/octet-stream" });
    if (value.length >= INGEST_BASE64_THRESHOLD && /^[A-Za-z0-9+/_-]+={0,2}$/.test(value)) return ingestMarker("binary", "string", { original_bytes: Math.floor(value.length * 0.75) });
    try {
      const url = new URL(value);
      if (url.username || url.password || [...url.searchParams.keys()].some((key) => INGEST_SENSITIVE_KEYS.has(normalizedKey(key)))) return ingestMarker("resource_uri", "string");
    } catch {
      // Ordinary strings are retained.
    }
    return value;
  }
  if (value === null || typeof value === "number" || typeof value === "boolean") return value;
  if (depth >= 20) return ingestMarker("max_payload_depth", Array.isArray(value) ? "array" : "object");
  if (!value || typeof value !== "object") return ingestMarker("binary", typeof value);
  if (seen.has(value)) return ingestMarker("circular", Array.isArray(value) ? "array" : "object");
  seen.add(value);
  try {
    if (Array.isArray(value)) return value.map((item) => scrubIngestValue(item, depth + 1, seen));
    const result: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) {
      result[key] = INGEST_SENSITIVE_KEYS.has(normalizedKey(key)) ? "[redacted]" : scrubIngestValue(child, depth + 1, seen);
    }
    return result;
  } finally {
    seen.delete(value);
  }
}

/** Last-line defense for payload fields received from non-SDK clients. */
export function sanitizeIngestPayload(value: Record<string, unknown>): Record<string, unknown> {
  try {
    const sanitized = scrubIngestValue(value);
    return isRecord(sanitized) ? sanitized : {};
  } catch {
    return { __trackmcp_truncated: true, reason: "unsupported", original_type: "object" };
  }
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= MAX_STRING_LENGTH;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && Number.isFinite(value) && value >= 0;
}

function isIsoTimestamp(value: unknown): value is string {
  return typeof value === "string" && ISO_TIMESTAMP.test(value) && Number.isFinite(Date.parse(value));
}

function checkOptionalStrings(event: Record<string, unknown>): string | undefined {
  const fields = [
    "schema_version", "server_id", "deployment_id", "server_version", "sdk_version", "protocol_version",
    "mcp_method", "request_id", "session_id", "task_id", "workflow_id", "client_name", "client_version",
    "tool_name", "tool_description", "tool_description_hash", "error_class", "schema_hash", "correlation_handle", "context", "missing_capability",
  ];
  for (const field of fields) {
    if (event[field] !== undefined && event[field] !== null && !isString(event[field])) return `${field} must be a non-empty string`;
  }
  return undefined;
}

export function isUuid(value: string): boolean {
  return UUID.test(value);
}

/** Intent is optional context, never a place for credentials or direct identity. */
export function sanitizeIntentText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const text = value.trim();
  if (!text || byteLength(text) > MAX_STRING_LENGTH || SENSITIVE_INTENT.test(text)) return undefined;
  return text;
}

export function normalizeTrackMCPEvent(value: unknown): EventValidationResult {
  if (!isRecord(value)) return { ok: false, reason: "event must be an object" };
  const event = value as Partial<TrackMCPEvent> & Record<string, unknown>;
  const eventId = typeof event.event_id === "string" ? event.event_id : undefined;
  if (!eventId || !EVENT_ID.test(eventId)) return { ok: false, reason: "event_id must be a non-empty valid identifier", eventId };
  if (typeof event.event_type !== "string" || !EVENT_TYPES.includes(event.event_type as TrackMCPEventType)) {
    return { ok: false, reason: "event_type is not supported", eventId };
  }
  for (const field of ["service", "environment"] as const) {
    if (!isString(event[field])) return { ok: false, reason: `${field} must be a non-empty string`, eventId };
  }
  if (!isIsoTimestamp(event.started_at)) return { ok: false, reason: "started_at must be an ISO-8601 timestamp", eventId };
  const optionalStringError = checkOptionalStrings(event);
  if (optionalStringError) return { ok: false, reason: optionalStringError, eventId };
  if (event.schema_version !== undefined && event.schema_version !== null && event.schema_version !== TRACKMCP_SCHEMA_VERSION && event.schema_version !== TRACKMCP_LEGACY_SCHEMA_VERSION) {
    return { ok: false, reason: "schema_version is unsupported", eventId };
  }
  if (event.direction !== undefined && event.direction !== null && !DIRECTIONS.includes(event.direction as typeof DIRECTIONS[number])) return { ok: false, reason: "direction is unsupported", eventId };
  if (event.transport !== undefined && event.transport !== null && !TRANSPORTS.includes(event.transport as typeof TRANSPORTS[number])) return { ok: false, reason: "transport is unsupported", eventId };
  if (event.payload_policy !== undefined && event.payload_policy !== null && !PAYLOAD_POLICIES.includes(event.payload_policy as typeof PAYLOAD_POLICIES[number])) return { ok: false, reason: "payload_policy is unsupported", eventId };
  if (event.session_id_source !== undefined && event.session_id_source !== null && !SESSION_ID_SOURCES.includes(event.session_id_source as TrackMCPSessionIdSource)) return { ok: false, reason: "session_id_source is unsupported", eventId };
  if (event.correlation_handle_source !== undefined && event.correlation_handle_source !== null && !CORRELATION_HANDLE_SOURCES.includes(event.correlation_handle_source as TrackMCPCorrelationHandleSource)) return { ok: false, reason: "correlation_handle_source is unsupported", eventId };
  if (event.correlation_handle !== undefined && event.correlation_handle !== null) {
    if (typeof event.correlation_handle !== "string" || !CORRELATION_HANDLE.test(event.correlation_handle) || byteLength(event.correlation_handle) > MAX_CORRELATION_HANDLE_BYTES || /(?:bearer(?:\s|[_:-])|eyJ[A-Za-z0-9_-]+\.|@|https?:\/\/|:\/\/|^sk[-_])/i.test(event.correlation_handle)) return { ok: false, reason: "correlation_handle must be a bounded opaque handle", eventId };
    if (event.correlation_handle_source !== "external" && event.correlation_handle_source !== "issued") return { ok: false, reason: "correlation_handle_source is required when correlation_handle is present", eventId };
  }
  if (event.intent_source !== undefined && event.intent_source !== null && !INTENT_SOURCES.includes(event.intent_source as TrackMCPIntentSource)) return { ok: false, reason: "intent_source is unsupported", eventId };
  const context = sanitizeIntentText(event.context);
  if (event.context !== undefined && event.context !== null && !context) return { ok: false, reason: "context must be bounded and privacy-safe", eventId };
  if (event.intent_source !== undefined && event.intent_source !== null && event.intent_source !== "missing" && !context) return { ok: false, reason: "context is required for intent_source", eventId };
  if (context && event.intent_source === "missing") return { ok: false, reason: "intent_source cannot be missing when context is present", eventId };
  if (event.missing_capability !== undefined && event.missing_capability !== null && !sanitizeIntentText(event.missing_capability)) return { ok: false, reason: "missing_capability must be bounded and privacy-safe", eventId };
  if ((event.correlation_handle_source === "external" || event.correlation_handle_source === "issued") && typeof event.correlation_handle !== "string") return { ok: false, reason: "correlation_handle is required for its source", eventId };
  for (const field of ["duration_ms", "retry_number", "payload_size_bytes"] as const) {
    if (event[field] !== undefined && event[field] !== null && !isNonNegativeInteger(event[field])) return { ok: false, reason: `${field} must be a non-negative integer`, eventId };
  }
  if (event.error_code !== undefined && event.error_code !== null && (!Number.isInteger(event.error_code) || !Number.isFinite(event.error_code))) return { ok: false, reason: "error_code must be an integer", eventId };
  for (const field of ["success", "is_error"] as const) {
    if (event[field] !== undefined && event[field] !== null && typeof event[field] !== "boolean") return { ok: false, reason: `${field} must be a boolean`, eventId };
  }
  if (event.payload !== undefined && event.payload !== null && !isRecord(event.payload)) return { ok: false, reason: "payload must be an object", eventId };

  const normalized = {
    ...event,
    ...(context ? { context, intent_source: event.intent_source || "context_parameter" } : { intent_source: "missing" }),
    ...(event.missing_capability ? { missing_capability: sanitizeIntentText(event.missing_capability) } : {}),
    schema_version: event.schema_version || TRACKMCP_LEGACY_SCHEMA_VERSION,
  } as CanonicalTrackMCPEvent;
  const serialized = JSON.stringify(normalized);
  if (!serialized || byteLength(serialized) > MAX_EVENT_BYTES) return { ok: false, reason: `event exceeds ${MAX_EVENT_BYTES} bytes`, eventId };
  if (normalized.payload !== undefined && byteLength(JSON.stringify(normalized.payload)) > MAX_PAYLOAD_BYTES) {
    return { ok: false, reason: `payload exceeds ${MAX_PAYLOAD_BYTES} bytes`, eventId };
  }
  return { ok: true, event: normalized };
}
