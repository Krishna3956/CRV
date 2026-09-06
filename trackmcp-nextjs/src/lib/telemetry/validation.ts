import {
  TRACKMCP_LEGACY_SCHEMA_VERSION,
  TRACKMCP_SCHEMA_VERSION,
  type CanonicalTrackMCPEvent,
  type TrackMCPEvent,
  type TrackMCPEventType,
  type TrackMCPSessionIdSource,
} from "./types.ts";

export const MAX_BATCH_EVENTS = 100;
export const MAX_REQUEST_BYTES = 1024 * 1024;
export const MAX_EVENT_BYTES = 256 * 1024;
export const MAX_PAYLOAD_BYTES = 128 * 1024;
export const MAX_STRING_LENGTH = 2048;

const EVENT_TYPES: readonly TrackMCPEventType[] = ["protocol", "tool_call", "session", "catalog", "workflow", "custom"];
const DIRECTIONS = ["client_to_server", "server_to_client"] as const;
const TRANSPORTS = ["stdio", "streamable_http", "sse", "custom"] as const;
const PAYLOAD_POLICIES = ["metadata", "redacted", "full"] as const;
const SESSION_ID_SOURCES = ["protocol", "transport_generated", "external", "missing"] as const;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EVENT_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/;

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
    "tool_name", "tool_description", "tool_description_hash", "error_class", "schema_hash",
  ];
  for (const field of fields) {
    if (event[field] !== undefined && event[field] !== null && !isString(event[field])) return `${field} must be a non-empty string`;
  }
  return undefined;
}

export function isUuid(value: string): boolean {
  return UUID.test(value);
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
  for (const field of ["duration_ms", "retry_number", "payload_size_bytes"] as const) {
    if (event[field] !== undefined && event[field] !== null && !isNonNegativeInteger(event[field])) return { ok: false, reason: `${field} must be a non-negative integer`, eventId };
  }
  if (event.error_code !== undefined && event.error_code !== null && (!Number.isInteger(event.error_code) || !Number.isFinite(event.error_code))) return { ok: false, reason: "error_code must be an integer", eventId };
  for (const field of ["success", "is_error"] as const) {
    if (event[field] !== undefined && event[field] !== null && typeof event[field] !== "boolean") return { ok: false, reason: `${field} must be a boolean`, eventId };
  }
  if (event.payload !== undefined && event.payload !== null && !isRecord(event.payload)) return { ok: false, reason: "payload must be an object", eventId };

  const normalized = { ...event, schema_version: event.schema_version || TRACKMCP_LEGACY_SCHEMA_VERSION } as CanonicalTrackMCPEvent;
  const serialized = JSON.stringify(normalized);
  if (!serialized || byteLength(serialized) > MAX_EVENT_BYTES) return { ok: false, reason: `event exceeds ${MAX_EVENT_BYTES} bytes`, eventId };
  if (normalized.payload !== undefined && byteLength(JSON.stringify(normalized.payload)) > MAX_PAYLOAD_BYTES) {
    return { ok: false, reason: `payload exceeds ${MAX_PAYLOAD_BYTES} bytes`, eventId };
  }
  return { ok: true, event: normalized };
}
