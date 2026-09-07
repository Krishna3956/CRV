import assert from "node:assert/strict";
import test from "node:test";
import { buildWebhookBody, retryDelayMs, sendSignedWebhook, signWebhookBody, validateWebhookDestination, verifyWebhookSignature } from "./delivery.ts";
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
  const allow = async (url: string): Promise<{ ok: true; url: string }> => ({ ok: true, url });
  const result = await sendSignedWebhook({ url: "https://hooks.example.test/trackmcp", secret: "secret", incident, idempotencyKey: "delivery-1", validateDestination: allow, fetchImpl: async (_url, init) => { seen.push(new Request("https://capture.test", init)); return new Response(null, { status: 204 }); } });
  assert.equal(result.state, "delivered");
  assert.equal(seen.length, 1);
  assert.equal(seen[0].headers.get("x-trackmcp-idempotency-key"), "delivery-1");
  assert.ok((await seen[0].text()).length < 32 * 1024);
});

test("webhook timeout and retryable failures are bounded", async () => {
  const allow = async (url: string): Promise<{ ok: true; url: string }> => ({ ok: true, url });
  const timeout = await sendSignedWebhook({ url: "https://hooks.example.test/trackmcp", secret: "secret", incident, idempotencyKey: "delivery-timeout", validateDestination: allow, fetchImpl: async () => new Promise<Response>((_resolve, reject) => setTimeout(() => reject(Object.assign(new Error("aborted"), { name: "AbortError" })), 1)) });
  assert.equal(timeout.state, "timeout");
  const retryable = await sendSignedWebhook({ url: "https://hooks.example.test/trackmcp", secret: "secret", incident, idempotencyKey: "delivery-503", validateDestination: allow, fetchImpl: async () => new Response(null, { status: 503 }) });
  assert.equal(retryable.state, "retryable_failure");
});

test("webhooks accept public DNS targets after checking every resolved address", async () => {
  const publicLookup = async (): Promise<Array<{ address: string; family: 4 | 6 }>> => [{ address: "93.184.216.34", family: 4 }];
  const lambdaHostname = "doali4pvvdpoqywnjiaerpktga0ryfkb.lambda-url.ap-south-1.on.aws";
  assert.deepEqual(await validateWebhookDestination(`https://${lambdaHostname}/`, publicLookup), { ok: true, url: `https://${lambdaHostname}/` });
  const mappedPublicLookup = async (): Promise<Array<{ address: string; family: 4 | 6 }>> => [{ address: "::ffff:5db8:d822", family: 6 }];
  assert.equal((await validateWebhookDestination("https://mapped.example.test/hook", mappedPublicLookup)).ok, true);
  const mixedLookup = async (): Promise<Array<{ address: string; family: 4 | 6 }>> => [{ address: "93.184.216.34", family: 4 }, { address: "10.0.0.1", family: 4 }];
  assert.equal((await validateWebhookDestination("https://mixed.example.test/hook", mixedLookup)).ok, false);
});

test("webhooks reject private, reserved, metadata, encoded, and link-local targets", async () => {
  const publicLookup = async (): Promise<Array<{ address: string; family: 4 | 6 }>> => [{ address: "93.184.216.34", family: 4 }];
  assert.equal((await validateWebhookDestination("https://127.0.0.1/hook", publicLookup)).ok, false);
  assert.equal((await validateWebhookDestination("https://10.0.0.1/hook", publicLookup)).ok, false);
  assert.equal((await validateWebhookDestination("https://169.254.169.254/hook", publicLookup)).ok, false);
  assert.equal((await validateWebhookDestination("https://192.0.2.1/hook", publicLookup)).ok, false);
  assert.equal((await validateWebhookDestination("https://198.51.100.1/hook", publicLookup)).ok, false);
  assert.equal((await validateWebhookDestination("https://service.internal/hook", publicLookup)).ok, false);
  assert.equal((await validateWebhookDestination("https://2130706433/hook", publicLookup)).ok, false);
  assert.equal((await validateWebhookDestination("https://0x7f000001/hook", publicLookup)).ok, false);
  assert.equal((await validateWebhookDestination("https://0177.0.0.1/hook", publicLookup)).ok, false);
  const allow = async (url: string): Promise<{ ok: true; url: string }> => ({ ok: true, url });
  const redirect = await sendSignedWebhook({ url: "https://hooks.example.test/trackmcp", secret: "secret", incident, idempotencyKey: "delivery-redirect", validateDestination: allow, fetchImpl: async (_url, init) => { assert.ok(init); assert.equal(init.redirect, "manual"); return new Response(null, { status: 302, headers: { location: "https://127.0.0.1" } }); } });
  assert.equal(redirect.state, "permanent_failure");
  assert.equal(redirect.error_code, "redirect_blocked");
  const linkLocal = async (): Promise<Array<{ address: string; family: 4 | 6 }>> => [{ address: "fe90::1", family: 6 }];
  assert.equal((await validateWebhookDestination("https://hooks.example.test/hook", linkLocal)).ok, false);
  const ipv6Rejected = ["::1", "::", "fc00::1", "fec0::1", "ff02::1", "100::1", "2001:2::1", "2001:10::1", "2001:20::1", "2001:db8::1", "::ffff:127.0.0.1"];
  for (const address of ipv6Rejected) {
    const lookup = async (): Promise<Array<{ address: string; family: 4 | 6 }>> => [{ address, family: 6 }];
    assert.equal((await validateWebhookDestination("https://ipv6.example.test/hook", lookup)).ok, false, address);
  }
});

test("webhook timeout wins even when fetch ignores abort", async () => {
  const allow = async (url: string): Promise<{ ok: true; url: string }> => ({ ok: true, url });
  const result = await sendSignedWebhook({ url: "https://hooks.example.test/trackmcp", secret: "secret", incident, idempotencyKey: "delivery-ignored-abort", validateDestination: allow, timeoutMs: 10, fetchImpl: async () => new Promise<Response>(() => {}) });
  assert.deepEqual(result, { state: "timeout", http_status: null, error_code: "timeout" });
});

test("webhook bodies bound large values before envelope serialization", () => {
  const huge = { ...incident, baseline: { ...incident.baseline, window: { start: "x".repeat(500_000), end: "y".repeat(500_000) } }, evidence: { giant: "z".repeat(500_000) } } as AlertIncident;
  const body = buildWebhookBody(huge);
  assert.ok(new TextEncoder().encode(body).byteLength <= 32 * 1024);
  assert.equal(JSON.parse(body).truncated, undefined);
});
