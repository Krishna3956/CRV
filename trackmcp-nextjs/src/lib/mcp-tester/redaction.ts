import type { JsonValue } from "./types.ts";

export const REDACTED_VALUE = "[redacted]" as const;

const SENSITIVE_KEY_PATTERN = /(?:authorization|cookie|set-cookie|password|passwd|secret|token|api[_-]?key|credential|private[_-]?key|client[_-]?secret|access[_-]?key|signature|sig)/i;
const BEARER_PATTERN = /\b(?:bearer|basic)\s+[^\s,;]+/gi;
const JWT_PATTERN = /\beyJ[a-zA-Z0-9_-]{8,}\.[a-zA-Z0-9_-]{4,}\.[a-zA-Z0-9_-]{4,}\b/g;
const QUERY_SECRET_PATTERN = /([?&](?:authorization|access[_-]?token|token|api[_-]?key|key|secret|password|credential|signature|sig|private[_-]?key)=)[^&#\s]*/gi;
const PRIVATE_KEY_PATTERN = /-----BEGIN [^-\r\n]*PRIVATE KEY-----[\s\S]*?-----END [^-\r\n]*PRIVATE KEY-----/gi;
const USERINFO_PATTERN = /\b([a-z][a-z\d+.-]*:\/\/)(?:[^\/@\s:]+(?::[^\/@\s]*)?@)/gi;
const COOKIE_PATTERN = /\b(?:cookie|set-cookie)\s*[:=]\s*[^\r\n]+/gi;
const ASSIGNMENT_SECRET_PATTERN = /\b((?:access[_-]?token|token|api[_-]?key|access[_-]?key|client[_-]?secret|secret|password|passwd|credential|signature|sig|private[_-]?key))\s*[:=]\s*["']?[^\s"',;]+/gi;

export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERN.test(key);
}

export function redactText(value: string, maxLength = 512): string {
  let redacted = value
    .replace(PRIVATE_KEY_PATTERN, REDACTED_VALUE)
    .replace(USERINFO_PATTERN, `$1`)
    .replace(COOKIE_PATTERN, REDACTED_VALUE)
    .replace(BEARER_PATTERN, REDACTED_VALUE)
    .replace(JWT_PATTERN, REDACTED_VALUE)
    .replace(ASSIGNMENT_SECRET_PATTERN, `$1=${REDACTED_VALUE}`);
  redacted = redacted.replace(QUERY_SECRET_PATTERN, `$1${REDACTED_VALUE}`);
  if (redacted.length > maxLength) return `${redacted.slice(0, Math.max(0, maxLength - 1))}…`;
  return redacted;
}

export function safeString(value: unknown, maxLength = 512): string | undefined {
  return typeof value === "string" ? redactText(value, maxLength) : undefined;
}

export function redactHeaders(headers: Readonly<Record<string, string>>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [name, value] of Object.entries(headers)) {
    result[name] = isSensitiveKey(name) ? REDACTED_VALUE : redactText(value);
  }
  return result;
}

export function safeEndpointForReport(url: URL, maxLength = 512): { origin: string; pathname: string; queryPresent: boolean } {
  const origin = redactText(url.origin, maxLength);
  const pathname = redactText(url.pathname || "/", maxLength);
  return { origin, pathname, queryPresent: url.search.length > 0 };
}

export function safeResourceUri(value: unknown, maxLength = 512): string | undefined {
  if (typeof value !== "string") return undefined;
  try {
    const url = new URL(value);
    return redactText(`${url.protocol}//${url.host}${url.pathname || "/"}`, maxLength);
  } catch {
    // A resource URI can be a non-URL URI scheme. Keep it bounded and redacted.
  }
  return redactText(value, maxLength);
}

export function redactJson(value: unknown, maxDepth: number, maxNodes: number, maxStringLength: number): JsonValue {
  let nodes = 0;

  const visit = (current: unknown, depth: number): JsonValue => {
    nodes += 1;
    if (nodes > maxNodes || depth > maxDepth) return "[truncated]";
    if (current === null || typeof current === "boolean" || typeof current === "number") return current;
    if (typeof current === "string") return redactText(current, maxStringLength);
    if (Array.isArray(current)) return current.map((item) => visit(item, depth + 1));
    if (typeof current === "object") {
      const result: { [key: string]: JsonValue } = {};
      for (const [key, child] of Object.entries(current as Record<string, unknown>)) {
        result[redactText(key, maxStringLength)] = isSensitiveKey(key)
          ? REDACTED_VALUE
          : visit(child, depth + 1);
      }
      return result;
    }
    return "[unsupported]";
  };

  return visit(value, 0);
}
