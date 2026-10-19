import test from "node:test";
import assert from "node:assert/strict";
import { InMemoryRateLimitProvider, clientRateLimitKey, rateLimitHeaders } from "./rate-limit.ts";

test("in-memory provider enforces a bounded window and returns retry time", () => {
  const provider = new InMemoryRateLimitProvider();
  const first = provider.consume({ key: "k", limit: 1, windowMs: 10_000, now: 1_000 });
  const second = provider.consume({ key: "k", limit: 1, windowMs: 10_000, now: 1_001 });
  assert.equal(first.allowed, true);
  assert.equal(second.allowed, false);
  assert.equal(second.mode, "memory_degraded");
  assert.equal(second.retryAfterSeconds, 10);
  assert.deepEqual(rateLimitHeaders(second), { "x-trackmcp-rate-limit-mode": "memory_degraded", "retry-after": "10" });
});

test("expired windows reset without sharing counters between keys", () => {
  const provider = new InMemoryRateLimitProvider();
  assert.equal(provider.consume({ key: "a", limit: 1, windowMs: 100, now: 0 }).allowed, true);
  assert.equal(provider.consume({ key: "b", limit: 1, windowMs: 100, now: 1 }).allowed, true);
  assert.equal(provider.consume({ key: "a", limit: 1, windowMs: 100, now: 100 }).allowed, true);
});

test("forwarding headers are ignored unless the trusted proxy flag is explicit", () => {
  const request = new Request("https://app.trackmcp.com/api", { headers: { "x-forwarded-for": "203.0.113.10" } });
  delete process.env.TRACKMCP_TRUST_PROXY;
  const first = clientRateLimitKey(request, "scope");
  const second = clientRateLimitKey(new Request("https://app.trackmcp.com/api", { headers: { "x-forwarded-for": "198.51.100.8" } }), "scope");
  assert.equal(first, second);
  process.env.TRACKMCP_TRUST_PROXY = "true";
  assert.notEqual(clientRateLimitKey(request, "scope"), clientRateLimitKey(new Request("https://app.trackmcp.com/api", { headers: { "x-forwarded-for": "198.51.100.8" } }), "scope"));
  delete process.env.TRACKMCP_TRUST_PROXY;
});

test("trusted edge address wins over a forwarded chain", () => {
  process.env.TRACKMCP_TRUST_PROXY = "true";
  const first = clientRateLimitKey(new Request("https://app.trackmcp.com/api", {
    headers: { "cf-connecting-ip": "203.0.113.10", "x-forwarded-for": "198.51.100.8, 192.0.2.4" },
  }), "scope");
  const second = clientRateLimitKey(new Request("https://app.trackmcp.com/api", {
    headers: { "cf-connecting-ip": "203.0.113.10", "x-forwarded-for": "192.0.2.4" },
  }), "scope");
  assert.equal(first, second);
  delete process.env.TRACKMCP_TRUST_PROXY;
});

test("ambiguous proxy values do not enable trust accidentally", () => {
  process.env.TRACKMCP_TRUST_PROXY = "yes";
  const first = clientRateLimitKey(new Request("https://app.trackmcp.com/api", { headers: { "x-forwarded-for": "203.0.113.10" } }), "scope");
  const second = clientRateLimitKey(new Request("https://app.trackmcp.com/api", { headers: { "x-forwarded-for": "198.51.100.8" } }), "scope");
  assert.equal(first, second);
  delete process.env.TRACKMCP_TRUST_PROXY;
});

test("memory pressure fails open instead of taking the service down", () => {
  const provider = new InMemoryRateLimitProvider();
  for (let i = 0; i < 10_000; i += 1) provider.consume({ key: `k-${i}`, limit: 1, windowMs: 10_000, now: 0 });
  const decision = provider.consume({ key: "new", limit: 1, windowMs: 10_000, now: 1 });
  assert.equal(decision.allowed, true);
  assert.equal(decision.mode, "memory_degraded");
});
