import { createHmac, timingSafeEqual } from "node:crypto";
import { DELIVERY_BACKOFF_MS, DELIVERY_TIMEOUT_MS, MAX_DELIVERY_ATTEMPTS, MAX_EVIDENCE_BYTES } from "./policy.ts";
import type { AlertIncident } from "./types.ts";

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
  const evidence = JSON.stringify({
    baseline: incident.baseline,
    comparison: incident.comparison,
    threshold: incident.threshold,
    reasons: incident.reasons.slice(0, 8),
    scope: incident.scope,
  });
  if (new TextEncoder().encode(evidence).byteLength <= MAX_EVIDENCE_BYTES) return JSON.parse(evidence) as Record<string, unknown>;
  return { truncated: true, reasons: incident.reasons.slice(0, 8), scope: incident.scope };
}

export function buildWebhookBody(incident: AlertIncident): string {
  const body = JSON.stringify({
    schema_version: "p1-05-v1",
    id: incident.id,
    metric: incident.metric,
    state: incident.state,
    severity: incident.severity,
    data_status: incident.data_status,
    scope: incident.scope,
    baseline: incident.baseline,
    comparison: incident.comparison,
    evidence: boundedEvidence(incident),
    first_seen_at: incident.first_seen_at,
    last_seen_at: incident.last_seen_at,
    resolved_at: incident.resolved_at,
  });
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

export async function sendSignedWebhook(options: {
  url: string;
  secret: string;
  incident: AlertIncident;
  idempotencyKey: string;
  fetchImpl?: typeof fetch;
  now?: () => Date;
}): Promise<WebhookDeliveryResult> {
  const fetchImpl = options.fetchImpl || fetch;
  const timestamp = (options.now || (() => new Date()))().toISOString();
  const body = buildWebhookBody(options.incident);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT_MS);
  try {
    const response = await fetchImpl(options.url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-trackmcp-timestamp": timestamp,
        "x-trackmcp-idempotency-key": options.idempotencyKey,
        "x-trackmcp-signature": `sha256=${signWebhookBody(body, options.secret, timestamp, options.idempotencyKey)}`,
      },
      body,
      signal: controller.signal,
    });
    if (response.ok) return { state: "delivered", http_status: response.status, error_code: null };
    if ([408, 425, 429].includes(response.status) || response.status >= 500) return { state: "retryable_failure", http_status: response.status, error_code: "upstream_unavailable" };
    return { state: "permanent_failure", http_status: response.status, error_code: "destination_rejected" };
  } catch (error) {
    return { state: error instanceof Error && error.name === "AbortError" ? "timeout" : "retryable_failure", http_status: null, error_code: error instanceof Error && error.name === "AbortError" ? "timeout" : "network_failure" };
  } finally {
    clearTimeout(timeout);
  }
}

export function shouldRetry(result: WebhookDeliveryResult, attemptNumber: number): boolean {
  return attemptNumber < MAX_DELIVERY_ATTEMPTS && (result.state === "retryable_failure" || result.state === "timeout");
}
