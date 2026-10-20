import assert from "node:assert/strict";
import test from "node:test";
import { evaluateAuthorizationAnomaly, evaluateIngestErrorAnomaly, evaluateRateLimitAnomaly } from "./operational-anomalies.ts";

const now = new Date("2026-10-19T12:00:00.000Z");
const event = (code: number, index: number) => ({ status_code: code, started_at: new Date(now.getTime() - index * 10_000).toISOString() });

test("anomaly evaluators remain insufficient below the minimum volume", () => {
  const result = evaluateRateLimitAnomaly([event(429, 0)], now);
  assert.equal(result.state, "insufficient_data");
  assert.equal(result.sample_count, 1);
});

test("429 spikes are classified with bounded counts and rates", () => {
  const events = [...Array.from({ length: 20 }, (_, i) => event(i < 10 ? 429 : 200, i))];
  const result = evaluateRateLimitAnomaly(events, now);
  assert.equal(result.state, "warning");
  assert.equal(result.failure_count, 10);
  assert.equal(result.failure_rate, 0.5);
});

test("401/403 anomalies include both authorization failure statuses", () => {
  const events = [...Array.from({ length: 20 }, (_, i) => event(i < 5 ? (i % 2 ? 403 : 401) : 200, i))];
  const result = evaluateAuthorizationAnomaly(events, now);
  assert.equal(result.state, "warning");
  assert.equal(result.failure_count, 5);
});

test("ingest 5xx spikes are route-scoped and do not absorb other endpoint failures", () => {
  const ingest = Array.from({ length: 20 }, (_, i) => ({ ...event(i < 5 ? 503 : 202, i), route: "/api/v1/ingest" }));
  const unrelated = Array.from({ length: 20 }, (_, i) => ({ ...event(500, i), route: "/api/v2/tools" }));
  const result = evaluateIngestErrorAnomaly([...ingest, ...unrelated], now);
  assert.equal(result.metric, "ingest_error_spike");
  assert.equal(result.state, "warning");
  assert.equal(result.sample_count, 20);
  assert.equal(result.failure_count, 5);
  assert.equal(result.failure_rate, 0.25);
});

test("findings contain no event identifiers or raw request material", () => {
  const result = evaluateIngestErrorAnomaly([{ status_code: 503, route: "/api/v1/ingest", started_at: now.toISOString(), secret: "nope" } as never], now);
  assert.deepEqual(Object.keys(result).sort(), ["failure_count", "failure_rate", "metric", "reasons", "sample_count", "state", "window_minutes"]);
});
