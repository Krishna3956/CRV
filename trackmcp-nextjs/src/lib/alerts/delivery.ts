import { createHmac, timingSafeEqual } from "node:crypto";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { DELIVERY_BACKOFF_MS, DELIVERY_TIMEOUT_MS, MAX_DELIVERY_ATTEMPTS, MAX_EVIDENCE_BYTES } from "./policy.ts";
import { boundedJsonValue } from "./http.ts";
import type { AlertIncident } from "./types.ts";

type LookupFunction = (hostname: string, options: { all: true; verbatim: true }) => Promise<Array<{ address: string; family: number }>>;

export type WebhookDeliveryResult = {
  state: "delivered" | "retryable_failure" | "permanent_failure" | "timeout" | "redacted_failure";
  http_status: number | null;
  error_code: string | null;
};

export function retryDelayMs(attemptNumber: number): number | null {
  if (!Number.isSafeInteger(attemptNumber) || attemptNumber < 1 || attemptNumber > DELIVERY_BACKOFF_MS.length) return null;
  return DELIVERY_BACKOFF_MS[attemptNumber - 1];
}

function boundedEvidence(incident: AlertIncident): Record<string, unknown> {
  const bounded = boundedJsonValue({
    baseline: incident.baseline,
    comparison: incident.comparison,
    threshold: incident.threshold,
    reasons: incident.reasons.slice(0, 8),
    scope: incident.scope,
  }, MAX_EVIDENCE_BYTES);
  return bounded && typeof bounded === "object" && !Array.isArray(bounded) ? bounded as Record<string, unknown> : { truncated: true };
}

export function buildWebhookBody(incident: AlertIncident): string {
  const boundedBody = {
    schema_version: "p1-05-v1",
    id: incident.id,
    metric: incident.metric,
    state: incident.state,
    severity: incident.severity,
    data_status: incident.data_status,
    scope: boundedJsonValue(incident.scope, 2 * 1024),
    baseline: boundedJsonValue(incident.baseline, 8 * 1024),
    comparison: boundedJsonValue(incident.comparison, 8 * 1024),
    evidence: boundedEvidence(incident),
    first_seen_at: incident.first_seen_at,
    last_seen_at: incident.last_seen_at,
    resolved_at: incident.resolved_at,
  };
  const body = JSON.stringify(boundedBody);
  if (new TextEncoder().encode(body).byteLength <= MAX_EVIDENCE_BYTES) return body;
  return JSON.stringify({ schema_version: "p1-05-v1", id: incident.id, metric: incident.metric, state: incident.state, severity: incident.severity, data_status: incident.data_status, truncated: true });
}

export function signWebhookBody(body: string, secret: string, timestamp: string, idempotencyKey: string): string {
  return createHmac("sha256", secret).update(`${timestamp}.${idempotencyKey}.${body}`).digest("hex");
}

export function verifyWebhookSignature(body: string, secret: string, timestamp: string, idempotencyKey: string, signature: string): boolean {
  const expected = signWebhookBody(body, secret, timestamp, idempotencyKey);
  const expectedBuffer = Buffer.from(expected, "utf8");
  const providedBuffer = Buffer.from(signature, "utf8");
  return expectedBuffer.length === providedBuffer.length && timingSafeEqual(expectedBuffer, providedBuffer);
}

function privateIpv4(value: string): boolean {
  const parts = value.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const [a, b, c] = parts;
  return a === 0 || a === 10 || a === 127 || a === 100 && b >= 64 && b <= 127 || a === 169 && b === 254 || a === 172 && b >= 16 && b <= 31 || a === 192 && (b === 0 || b === 2 || b === 88 || b === 168) || a === 198 && (b >= 18 && b <= 19 || b === 51) || a === 203 && b === 0 && c === 113 || a >= 224;
}

function ipv6Hextets(value: string): number[] | null {
  const sections = value.toLowerCase().split("::");
  if (sections.length > 2) return null;
  const left = sections[0] ? sections[0].split(":") : [];
  const right = sections.length === 2 && sections[1] ? sections[1].split(":") : [];
  if ([...left, ...right].some((part) => !/^[0-9a-f]{1,4}$/.test(part))) return null;
  if (sections.length === 1 && left.length !== 8) return null;
  if (sections.length === 2 && left.length + right.length >= 8) return null;
  const middle = Array.from({ length: sections.length === 2 ? 8 - left.length - right.length : 0 }, () => "0");
  return [...left, ...middle, ...right].map((part) => Number.parseInt(part, 16));
}

function ipv6InRange(address: number[], prefix: number[], prefixBits: number): boolean {
  for (let index = 0; index < prefix.length; index += 1) {
    const remaining = prefixBits - index * 16;
    if (remaining <= 0) break;
    const mask = remaining >= 16 ? 0xffff : (0xffff << (16 - remaining)) & 0xffff;
    if ((address[index] & mask) !== (prefix[index] & mask)) return false;
  }
  return true;
}

function privateAddress(value: string): boolean {
  const normalized = value.toLowerCase();
  if (isIP(normalized) === 4) return privateIpv4(normalized);
  if (isIP(normalized) !== 6) return true;
  if (normalized.startsWith("::ffff:") && isIP(normalized.slice("::ffff:".length)) === 4) return privateIpv4(normalized.slice("::ffff:".length));
  const address = ipv6Hextets(normalized);
  if (!address) return true;
  const embeddedIpv4 = address.slice(0, 6).every((part) => part === 0)
    || address.slice(0, 5).every((part) => part === 0) && address[5] === 0xffff
    || ipv6InRange(address, [0x64, 0xff9b, 0, 0, 0, 0, 0, 0], 96)
    || ipv6InRange(address, [0x2002, 0, 0, 0, 0, 0, 0, 0], 16)
    || ipv6InRange(address, [0x2001, 0, 0, 0, 0, 0, 0, 0], 32);
  if (embeddedIpv4) {
    const embeddedParts = address.slice(6, 8);
    const embedded = `${embeddedParts[0] >> 8}.${embeddedParts[0] & 0xff}.${embeddedParts[1] >> 8}.${embeddedParts[1] & 0xff}`;
    if (privateIpv4(embedded)) return true;
    // IPv4-compatible, mapped, NAT64, 6to4, and Teredo forms remain rejected
    // even when their normalized embedded address is public.
    return true;
  }
  return ipv6InRange(address, [0, 0, 0, 0, 0, 0, 0, 0], 128)
    || ipv6InRange(address, [0, 0, 0, 0, 0, 0, 0, 1], 128)
    || ipv6InRange(address, [0xfe80, 0, 0, 0, 0, 0, 0, 0], 10)
    || ipv6InRange(address, [0xfc00, 0, 0, 0, 0, 0, 0, 0], 7)
    || ipv6InRange(address, [0xfec0, 0, 0, 0, 0, 0, 0, 0], 10)
    || ipv6InRange(address, [0xff00, 0, 0, 0, 0, 0, 0, 0], 8)
    || ipv6InRange(address, [0x100, 0, 0, 0, 0, 0, 0, 0], 64)
    || ipv6InRange(address, [0x2001, 0x2, 0, 0, 0, 0, 0, 0], 48)
    || ipv6InRange(address, [0x2001, 0x10, 0, 0, 0, 0, 0, 0], 28)
    || ipv6InRange(address, [0x2001, 0x20, 0, 0, 0, 0, 0, 0], 28)
    || ipv6InRange(address, [0x2001, 0xdb8, 0, 0, 0, 0, 0, 0], 32);
}

export async function validateWebhookDestination(value: string, lookupImpl: LookupFunction = lookup): Promise<{ ok: true; url: string } | { ok: false; reason: "invalid_url" | "private_target" | "internal_hostname" | "dns_failure" }> {
  let endpoint: URL;
  try { endpoint = new URL(value); } catch { return { ok: false, reason: "invalid_url" }; }
  const hostname = endpoint.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (endpoint.protocol !== "https:" || endpoint.username || endpoint.password || !hostname) return { ok: false, reason: "invalid_url" };
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local") || hostname.endsWith(".internal") || hostname.endsWith(".lan") || hostname.endsWith(".home.arpa") || !hostname.includes(".")) return { ok: false, reason: "internal_hostname" };
  if (/^(?:0x[0-9a-f]+|[0-9]+)$/i.test(hostname) || (isIP(hostname) !== 0 && privateAddress(hostname))) return { ok: false, reason: "private_target" };
  try {
    const addresses = await lookupImpl(hostname, { all: true, verbatim: true });
    if (!addresses.length || addresses.some((address) => privateAddress(address.address))) return { ok: false, reason: "private_target" };
  } catch {
    return { ok: false, reason: "dns_failure" };
  }
  return { ok: true, url: endpoint.toString() };
}

export async function sendSignedWebhook(options: {
  url: string;
  secret: string;
  incident: AlertIncident;
  idempotencyKey: string;
  fetchImpl?: typeof fetch;
  now?: () => Date;
  timeoutMs?: number;
  validateDestination?: (url: string) => Promise<{ ok: true; url: string } | { ok: false; reason: string }>;
}): Promise<WebhookDeliveryResult> {
  const fetchImpl = options.fetchImpl || fetch;
  const timestamp = (options.now || (() => new Date()))().toISOString();
  const body = buildWebhookBody(options.incident);
  const validation = await (options.validateDestination || ((url) => validateWebhookDestination(url)))(options.url);
  if (!validation.ok) return { state: "permanent_failure", http_status: null, error_code: "destination_rejected" };
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs || DELIVERY_TIMEOUT_MS;
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  try {
    const fetchPromise = fetchImpl(validation.url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-trackmcp-timestamp": timestamp,
        "x-trackmcp-idempotency-key": options.idempotencyKey,
        "x-trackmcp-signature": `sha256=${signWebhookBody(body, options.secret, timestamp, options.idempotencyKey)}`,
      },
      body,
      signal: controller.signal,
      redirect: "manual",
    });
    const timeout = new Promise<Response>((_resolve, reject) => {
      timeoutHandle = setTimeout(() => {
        controller.abort();
        reject(Object.assign(new Error("timeout"), { name: "AbortError" }));
      }, timeoutMs);
    });
    const response = await Promise.race([fetchPromise, timeout]);
    if (response.ok) return { state: "delivered", http_status: response.status, error_code: null };
    if (response.status >= 300 && response.status < 400) return { state: "permanent_failure", http_status: response.status, error_code: "redirect_blocked" };
    if ([408, 425, 429].includes(response.status) || response.status >= 500) return { state: "retryable_failure", http_status: response.status, error_code: "upstream_unavailable" };
    return { state: "permanent_failure", http_status: response.status, error_code: "destination_rejected" };
  } catch (error) {
    return { state: error instanceof Error && error.name === "AbortError" ? "timeout" : "retryable_failure", http_status: null, error_code: error instanceof Error && error.name === "AbortError" ? "timeout" : "network_failure" };
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }
}

export function shouldRetry(result: WebhookDeliveryResult, attemptNumber: number): boolean {
  return attemptNumber < MAX_DELIVERY_ATTEMPTS && (result.state === "retryable_failure" || result.state === "timeout");
}
