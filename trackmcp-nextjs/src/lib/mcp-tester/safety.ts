import { normalizeMcpTesterLimits } from "./limits.ts";
import type {
  EndpointValidationResult,
  HeaderValidationResult,
  McpTesterLimits,
} from "./types.ts";

const HEADER_NAME_PATTERN = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
const UNSAFE_HEADER_CONTROL_PATTERN = /[\u0000-\u001f\u007f]/;
const FORBIDDEN_BROWSER_HEADERS = new Set([
  "accept-encoding",
  "access-control-request-headers",
  "access-control-request-method",
  "connection",
  "content-length",
  "cookie",
  "dnt",
  "host",
  "origin",
  "referer",
  "sec-fetch-dest",
  "sec-fetch-mode",
  "sec-fetch-site",
  "set-cookie",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "user-agent",
]);

const METADATA_HOSTNAMES = new Set([
  "169.254.169.254",
  "metadata",
  "metadata.google.internal",
  "instance-data",
  "instance-data.ec2.internal",
  "metadata.azure.com",
  "100.100.100.200",
]);

const CREDENTIAL_QUERY_PATTERN = /^(?:authorization|access[_-]?token|token|api[_-]?key|key|secret|password|passwd|credential|signature|sig|private[_-]?key|client[_-]?secret)$/i;

export function validateMcpEndpoint(endpoint: unknown, limits?: Partial<McpTesterLimits>): EndpointValidationResult {
  const effectiveLimits = normalizeMcpTesterLimits(limits);
  if (typeof endpoint !== "string") return { ok: false, code: "invalid_url", message: "Enter a valid HTTPS MCP endpoint." };
  if (endpoint.length > effectiveLimits.maxEndpointUrlLength) return { ok: false, code: "url_too_long", message: "The endpoint URL exceeds the safety limit." };
  if (/[\u0000-\u001f\u007f]/.test(endpoint)) return { ok: false, code: "invalid_url", message: "The endpoint URL contains unsupported control characters." };

  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return { ok: false, code: "invalid_url", message: "Enter a valid HTTPS MCP endpoint." };
  }

  if (url.protocol !== "https:") return { ok: false, code: "unsupported_scheme", message: "Only public HTTPS Streamable HTTP endpoints are supported." };
  if (url.username || url.password) return { ok: false, code: "credentials_in_url", message: "Credentials in endpoint URLs are not accepted." };
  for (const [key] of url.searchParams) {
    if (CREDENTIAL_QUERY_PATTERN.test(key)) return { ok: false, code: "credentials_in_url", message: "Credential-like query parameters are not accepted." };
  }

  const hostname = normalizeHostname(url.hostname);
  if (METADATA_HOSTNAMES.has(hostname) || hostname.endsWith(".internal") || hostname.endsWith(".local") || hostname.endsWith(".lan")) {
    return { ok: false, code: hostname.includes("metadata") || METADATA_HOSTNAMES.has(hostname) ? "cloud_metadata_target" : "unsafe_hostname", message: "Private, internal, and cloud-metadata targets are not allowed." };
  }
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname === "local") {
    return { ok: false, code: "unsafe_hostname", message: "Localhost and local network targets are not allowed." };
  }
  if (isUnsafeIpAddress(hostname) || containsUnsafeEmbeddedIpv4(hostname)) return { ok: false, code: "unsafe_ip_address", message: "Private, loopback, link-local, and metadata IP targets are not allowed." };

  url.hash = "";
  return {
    ok: true,
    requestUrl: url,
    safeEndpoint: {
      origin: url.origin,
      pathname: url.pathname || "/",
      queryPresent: url.search.length > 0,
    },
  };
}

export function validateMcpHeaders(input: unknown, limits?: Partial<McpTesterLimits>): HeaderValidationResult {
  const effectiveLimits = normalizeMcpTesterLimits(limits);
  if (input === undefined) return { ok: true, entries: [], hasAuthorization: false };
  if (input === null || typeof input !== "object" || Array.isArray(input)) return { ok: false, code: "headers_not_object", message: "Headers must be provided as a name/value object." };

  const entries: [string, string][] = [];
  let totalBytes = 0;
  let hasAuthorization = false;
  for (const [rawName, rawValue] of Object.entries(input as Record<string, unknown>)) {
    if (entries.length + 4 > effectiveLimits.maxHeaderCount) return { ok: false, code: "too_many_headers", message: "Too many request headers." };
    const name = rawName.trim();
    if (!HEADER_NAME_PATTERN.test(name) || UNSAFE_HEADER_CONTROL_PATTERN.test(rawName)) return { ok: false, code: "header_name_invalid", message: "A request header name is invalid." };
    if (name.length > effectiveLimits.maxHeaderNameLength) return { ok: false, code: "header_name_too_long", message: "A request header name exceeds the safety limit." };
    const lowerName = name.toLowerCase();
    if (FORBIDDEN_BROWSER_HEADERS.has(lowerName) || lowerName.startsWith("proxy-") || lowerName.startsWith("sec-")) {
      return { ok: false, code: "browser_forbidden_header", message: "A browser-forbidden request header was provided." };
    }
    if (typeof rawValue !== "string" || UNSAFE_HEADER_CONTROL_PATTERN.test(rawValue)) return { ok: false, code: "header_value_invalid", message: "A request header value is invalid." };
    if (rawValue.length > effectiveLimits.maxHeaderValueLength) return { ok: false, code: "header_value_too_long", message: "A request header value exceeds the safety limit." };
    totalBytes += utf8Length(name) + utf8Length(rawValue);
    if (totalBytes + 128 > effectiveLimits.maxHeaderBytes) return { ok: false, code: "headers_too_large", message: "The request headers exceed the safety limit." };
    entries.push([name, rawValue]);
    hasAuthorization ||= lowerName === "authorization";
  }
  return { ok: true, entries, hasAuthorization };
}

function normalizeHostname(hostname: string): string {
  return hostname.toLowerCase().replace(/^\[/, "").replace(/\]$/, "").replace(/\.$/, "");
}

function utf8Length(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function isUnsafeIpAddress(hostname: string): boolean {
  if (isIpv4(hostname)) return isUnsafeIpv4(hostname);
  if (!hostname.includes(":")) return false;
  const normalized = hostname.toLowerCase();
  if (normalized === "::1" || normalized === "::" || normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb")) return true;
  const mappedIpv4 = extractMappedIpv4(normalized);
  return mappedIpv4 !== undefined && isUnsafeIpv4(mappedIpv4);
}

function isIpv4(value: string): boolean {
  const parts = value.split(".");
  return parts.length === 4 && parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255);
}

function isUnsafeIpv4(value: string): boolean {
  const [a, b] = value.split(".").map(Number);
  return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && (b === 0 || b === 168)) || (a === 198 && b >= 18 && b <= 19) || (a === 203 && b === 0) || a >= 224;
}

function containsUnsafeEmbeddedIpv4(hostname: string): boolean {
  const dottedMatch = hostname.match(/(?:^|\.)(\d{1,3}(?:\.\d{1,3}){3})(?:\.|$)/);
  if (dottedMatch && isUnsafeIpv4(dottedMatch[1])) return true;
  const dashedMatch = hostname.match(/(?:^|\.)(\d{1,3}(?:-\d{1,3}){3})(?:\.|$)/);
  return Boolean(dashedMatch && isUnsafeIpv4(dashedMatch[1].replace(/-/g, ".")));
}

function extractMappedIpv4(value: string): string | undefined {
  const last = value.split(":").at(-1);
  if (last && isIpv4(last)) return last;
  const groups = expandIpv6(value);
  if (!groups || groups.slice(0, 5).some((group) => group !== 0) || groups[5] !== 0xffff) return undefined;
  return `${groups[6] >> 8}.${groups[6] & 255}.${groups[7] >> 8}.${groups[7] & 255}`;
}

function expandIpv6(value: string): number[] | undefined {
  const parts = value.split("::");
  if (parts.length > 2) return undefined;
  const parsePart = (part: string): number[] => {
    if (!part) return [];
    const pieces = part.split(":");
    const result: number[] = [];
    for (const piece of pieces) {
      if (piece.includes(".")) {
        if (!isIpv4(piece)) return [];
        const octets = piece.split(".").map(Number);
        result.push((octets[0] << 8) | octets[1], (octets[2] << 8) | octets[3]);
      } else if (/^[0-9a-f]{1,4}$/i.test(piece)) {
        result.push(Number.parseInt(piece, 16));
      } else {
        return [];
      }
    }
    return result;
  };
  const left = parsePart(parts[0]);
  const right = parts.length === 2 ? parsePart(parts[1]) : [];
  if (left.length === 0 && parts[0] !== "") return undefined;
  if (right.length === 0 && parts.length === 2 && parts[1] !== "") return undefined;
  if (parts.length === 1) return left.length === 8 ? left : undefined;
  const missing = 8 - left.length - right.length;
  return missing > 0 ? [...left, ...Array.from({ length: missing }, () => 0), ...right] : undefined;
}
