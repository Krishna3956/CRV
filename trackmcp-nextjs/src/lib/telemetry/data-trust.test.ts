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
});

test("empty or malformed counts are bounded without inventing an observation", () => {
  const result = buildTrackMCPDataTrust({ generatedAt: "now", querySince: "since", sourceEventCount: -2.8, returnedEventCount: -1, queryLimit: 0, observedThrough: null });
  assert.deepEqual(result, { generated_at: "now", query_since: "since", query_until: "now", source_event_count: 0, returned_event_count: 0, truncated: false, observed_through: null });
});
