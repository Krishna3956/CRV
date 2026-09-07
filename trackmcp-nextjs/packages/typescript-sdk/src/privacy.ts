export type PayloadMode = "metadata" | "redacted" | "full";

export const DEFAULT_MAX_PAYLOAD_BYTES = 32 * 1024;
export const DEFAULT_MAX_PAYLOAD_DEPTH = 6;
export const DEFAULT_MAX_PAYLOAD_KEYS = 50;
export const DEFAULT_MAX_STRING_LENGTH = 2048;
export const DEFAULT_MAX_QUEUE_EVENTS = 500;
export const DEFAULT_MAX_QUEUE_BYTES = 2 * 1024 * 1024;
export const DEFAULT_MAX_BATCH_SIZE = 20;

export const REDACTION_MARKER = "[redacted]";
export const TRUNCATION_MARKER_KEY = "__trackmcp_truncated";
const BASE64_SCRUB_THRESHOLD = 128;

const DEFAULT_SENSITIVE_KEYS = new Set([
  "password",
  "passwd",
  "secret",
  "token",
  "api_key",
  "apikey",
  "authorization",
  "cookie",
  "set_cookie",
  "access_token",
  "refresh_token",
  "private_key",
  "client_secret",
  "email",
  "e_mail",
  "ssn",
  "credit_card",
  "card_number",
]);

export type PayloadPrivacyOptions = {
  mode: PayloadMode;
  explicitPaths?: readonly string[];
  redactKeys?: readonly string[];
  maxPayloadBytes?: number;
  maxPayloadDepth?: number;
  maxPayloadKeys?: number;
  maxStringLength?: number;
};

type TruncationReason = "max_payload_depth" | "max_payload_keys" | "max_string_length" | "max_payload_bytes" | "binary" | "resource_uri" | "credential" | "circular";

function normalizedKey(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[\s-]+/g, "_")
    .toLowerCase();
}

function marker(reason: TruncationReason, originalType: string, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return { [TRUNCATION_MARKER_KEY]: true, reason, original_type: originalType, ...extra };
}

function originalType(value: unknown): string {
  if (Array.isArray(value)) return "array";
  if (value === null) return "null";
  if (value instanceof Uint8Array || value instanceof ArrayBuffer || ArrayBuffer.isView(value)) return "binary";
  return typeof value;
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function safeJson(value: unknown): string | undefined {
  try {
    return JSON.stringify(value);
  } catch {
    return undefined;
  }
}

const SENSITIVE_TEXT_PATTERNS = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /\bbearer\s+[A-Za-z0-9._~+\/-]+=*/i,
  /\bbasic\s+[A-Za-z0-9+/=]{8,}/i,
  /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/i,
  /\b(?:api[_-]?key|access[_-]?token|refresh[_-]?token|client[_-]?secret|password|secret|authorization)\s*[:=]\s*\S+/i,
];

function likelyBase64(value: string): boolean {
  return value.length >= BASE64_SCRUB_THRESHOLD && /^[A-Za-z0-9+/_-]+={0,2}$/.test(value);
}

function resourceMarker(value: string): Record<string, unknown> | undefined {
  const dataUri = value.match(/^data:([^;,]+)?(?:;base64)?,/i);
  if (dataUri) {
    return marker("binary", "string", {
      media_type: dataUri[1] || "application/octet-stream",
      original_bytes: Math.max(0, Math.floor((value.length - dataUri[0].length) * 0.75)),
    });
  }
  if (/(?:authorization|api[_-]?key|access[_-]?token|refresh[_-]?token|password|secret)\s*[:=]\s*\S+/i.test(value)) return marker("credential", "string");
  if (/\bbearer\s+[A-Za-z0-9._~+/-]+=*/i.test(value)) return marker("resource_uri", "string");
  if (SENSITIVE_TEXT_PATTERNS.some((pattern) => pattern.test(value))) return marker("credential", "string");
  try {
    const url = new URL(value);
    const hasCredentials = Boolean(url.username || url.password);
    const hasSensitiveQuery = [...url.searchParams.keys()].some((key) => DEFAULT_SENSITIVE_KEYS.has(normalizedKey(key)));
    if (hasCredentials || hasSensitiveQuery) return marker("resource_uri", "string");
  } catch {
    // Not a URL; it can still be an ordinary string or base64 value.
  }
  if (likelyBase64(value)) return marker("binary", "string", { original_bytes: Math.floor(value.length * 0.75) });
  return undefined;
}

function isSensitiveKey(key: string, extraKeys: ReadonlySet<string>): boolean {
  const normalized = normalizedKey(key);
  return DEFAULT_SENSITIVE_KEYS.has(normalized) || extraKeys.has(normalized);
}

function pathSet(paths: readonly string[]): ReadonlySet<string> {
  return new Set(paths.filter(Boolean).map((path) => path.split(".").filter(Boolean).join(".")));
}

function sanitizeValue(
  value: unknown,
  depth: number,
  path: string,
  options: Required<Pick<PayloadPrivacyOptions, "maxPayloadDepth" | "maxPayloadKeys" | "maxStringLength">>,
  explicitPaths: ReadonlySet<string>,
  extraKeys: ReadonlySet<string>,
  seen: WeakSet<object>,
): unknown {
  if (path && explicitPaths.has(path)) return REDACTION_MARKER;
  if (typeof value === "string") {
    const resource = resourceMarker(value);
    if (resource) return resource;
    return value.length > options.maxStringLength ? marker("max_string_length", "string") : value;
  }
  if (value === null || typeof value === "number" || typeof value === "boolean") return value;
  if (value === undefined) return undefined;
  if (value instanceof Uint8Array || value instanceof ArrayBuffer || ArrayBuffer.isView(value)) {
    return marker("binary", "binary", { original_bytes: value.byteLength });
  }
  if (typeof value !== "object") return marker("binary", typeof value);
  if (seen.has(value)) return marker("circular", originalType(value));
  if (depth >= options.maxPayloadDepth) return marker("max_payload_depth", originalType(value));

  seen.add(value);
  try {
    if (Array.isArray(value)) {
      const result = value.slice(0, options.maxPayloadKeys).map((item, index) => sanitizeValue(item, depth + 1, path ? `${path}.${index}` : String(index), options, explicitPaths, extraKeys, seen));
      if (value.length > options.maxPayloadKeys) result.push(marker("max_payload_keys", "array"));
      return result;
    }
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record);
    const result: Record<string, unknown> = {};
    for (const key of keys.slice(0, options.maxPayloadKeys)) {
      const childPath = path ? `${path}.${key}` : key;
      try {
        if (isSensitiveKey(key, extraKeys)) result[key] = REDACTION_MARKER;
        else result[key] = sanitizeValue(record[key], depth + 1, childPath, options, explicitPaths, extraKeys, seen);
      } catch {
        result[key] = marker("binary", "unknown");
      }
    }
    if (keys.length > options.maxPayloadKeys) result[TRUNCATION_MARKER_KEY] = marker("max_payload_keys", "object");
    return result;
  } finally {
    seen.delete(value);
  }
}

export function payloadByteLength(value: unknown): number {
  const serialized = safeJson(value);
  return serialized === undefined ? 0 : byteLength(serialized);
}

export function sanitizePayload(value: unknown, options: PayloadPrivacyOptions): unknown {
  if (options.mode === "metadata" || value === undefined) return undefined;
  const limits = {
    maxPayloadDepth: Math.min(DEFAULT_MAX_PAYLOAD_DEPTH, Math.max(0, Math.floor(options.maxPayloadDepth ?? DEFAULT_MAX_PAYLOAD_DEPTH))),
    maxPayloadKeys: Math.min(DEFAULT_MAX_PAYLOAD_KEYS, Math.max(1, Math.floor(options.maxPayloadKeys ?? DEFAULT_MAX_PAYLOAD_KEYS))),
    maxStringLength: Math.min(DEFAULT_MAX_STRING_LENGTH, Math.max(1, Math.floor(options.maxStringLength ?? DEFAULT_MAX_STRING_LENGTH))),
  };
  const sanitized = sanitizeValue(value, 0, "", limits, pathSet(options.explicitPaths || []), new Set((options.redactKeys || []).map(normalizedKey)), new WeakSet());
  const maxBytes = Math.min(DEFAULT_MAX_PAYLOAD_BYTES, Math.max(1, Math.floor(options.maxPayloadBytes ?? DEFAULT_MAX_PAYLOAD_BYTES)));
  const serialized = safeJson(sanitized);
  if (serialized !== undefined && byteLength(serialized) <= maxBytes) return sanitized;
  const budgetMarker = marker("max_payload_bytes", originalType(value));
  return payloadByteLength(budgetMarker) <= maxBytes ? budgetMarker : {};
}
