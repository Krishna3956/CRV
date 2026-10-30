import assert from "node:assert/strict";
import test from "node:test";
import { buildTrackMCPDataTrust } from "./data-trust.ts";

test("data trust reports the bounded scan and observed watermark", () => {
  const result = buildTrackMCPDataTrust({
    generatedAt: "2026-10-18T00:10:00.000Z",
    querySince: "2026-10-17T00:10:00.000Z",
    sourceEventCount: 100,
    returnedEventCount: 100,
    queryLimit: 100,
    observedThrough: "2026-10-17T23:59:00.000Z",
  });
  assert.equal(result.truncated, true);
  assert.equal(result.query_until, result.generated_at);
  assert.equal(result.observed_through, "2026-10-17T23:59:00.000Z");
  assert.equal(result.observation_recency.status, "recent");
  assert.equal(result.observation_recency.limitation, "evidence_recency_only_not_service_health");
});

test("empty or malformed counts are bounded without inventing an observation", () => {
  const result = buildTrackMCPDataTrust({ generatedAt: "now", querySince: "since", sourceEventCount: -2.8, returnedEventCount: -1, queryLimit: 0, observedThrough: null });
  assert.deepEqual(result, {
    generated_at: "now",
    query_since: "since",
    query_until: "now",
    source_event_count: 0,
    returned_event_count: 0,
    truncated: false,
    observed_through: null,
    observation_recency: {
      status: "no_observation",
      observed_at: null,
      age_ms: null,
      stale_after_ms: 86_400_000,
      limitation: "evidence_recency_only_not_service_health",
    },
  });
});

test("observation recency distinguishes a stale watermark without becoming health", () => {
  const result = buildTrackMCPDataTrust({
    generatedAt: "2026-10-20T00:00:00.000Z",
    querySince: "2026-10-01T00:00:00.000Z",
    sourceEventCount: 1,
    returnedEventCount: 1,
    queryLimit: 100,
    observedThrough: "2026-10-18T00:00:00.000Z",
  });
  assert.equal(result.observation_recency.status, "stale");
  assert.equal(result.observation_recency.age_ms, 172_800_000);
  assert.equal(result.observation_recency.stale_after_ms, 86_400_000);
});
