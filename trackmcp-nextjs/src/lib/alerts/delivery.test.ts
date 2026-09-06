import assert from "node:assert/strict";
import test from "node:test";
import { buildWebhookBody, retryDelayMs, sendSignedWebhook, signWebhookBody, verifyWebhookSignature } from "./delivery.ts";
import type { AlertIncident } from "./types.ts";

const incident: AlertIncident = { id: "incident-1", workspace_id: "workspace-1", alert_id: "alert-1", identity: "identity", metric: "tool_error_rate_spike", state: "firing", severity: "warning", scope: { tool_name: "search", environment: "production" }, data_status: "sufficient", baseline: { numerator: 1, denominator: 30, value: 1 / 30, window: { start: "2026-08-30T00:00:00Z", end: "2026-09-06T00:00:00Z" } }, comparison: { numerator: 10, denominator: 30, value: 1 / 3, window: { start: "2026-09-06T00:00:00Z", end: "2026-09-07T00:00:00Z" } }, threshold: { warning_delta: 0.1 }, reasons: [], evidence: {}, first_seen_at: "2026-09-07T00:00:00Z", last_seen_at: "2026-09-07T01:00:00Z", acknowledged_at: null, resolved_at: null, suppressed_reason: null, recovery: null, revision: 1 };

test("webhooks are signed, bounded, and idempotent", async () => {
  const body = buildWebhookBody(incident);
  const signature = signWebhookBody(body, "secret", "2026-09-07T01:00:00.000Z", "delivery-1");
  assert.equal(verifyWebhookSignature(body, "secret", "2026-09-07T01:00:00.000Z", "delivery-1", signature), true);
  assert.equal(verifyWebhookSignature(body, "wrong", "2026-09-07T01:00:00.000Z", "delivery-1", signature), false);
  assert.equal(retryDelayMs(1), 60_000);
  assert.equal(retryDelayMs(4), null);
  const seen: Request[] = [];
  const result = await sendSignedWebhook({ url: "https://hooks.example.test/trackmcp", secret: "secret", incident, idempotencyKey: "delivery-1", fetchImpl: async (_url, init) => { seen.push(new Request("https://capture.test", init)); return new Response(null, { status: 204 }); } });
  assert.equal(result.state, "delivered");
  assert.equal(seen.length, 1);
  assert.equal(seen[0].headers.get("x-trackmcp-idempotency-key"), "delivery-1");
  assert.ok((await seen[0].text()).length < 32 * 1024);
});

test("webhook timeout and retryable failures are bounded", async () => {
  const timeout = await sendSignedWebhook({ url: "https://hooks.example.test/trackmcp", secret: "secret", incident, idempotencyKey: "delivery-timeout", fetchImpl: async () => new Promise<Response>((_resolve, reject) => setTimeout(() => reject(Object.assign(new Error("aborted"), { name: "AbortError" })), 1)) });
  assert.equal(timeout.state, "timeout");
  const retryable = await sendSignedWebhook({ url: "https://hooks.example.test/trackmcp", secret: "secret", incident, idempotencyKey: "delivery-503", fetchImpl: async () => new Response(null, { status: 503 }) });
  assert.equal(retryable.state, "retryable_failure");
});
