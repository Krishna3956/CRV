import assert from "node:assert/strict";
import test from "node:test";
import { withTrackMCPV2Envelope } from "./v2-envelope.ts";

test("v2 envelope exposes bounded provenance and freshness metadata", () => {
  const body = withTrackMCPV2Envelope({
    range_days: 30,
    total_events: 12,
    data_trust: {
      generated_at: "2026-10-18T10:00:00.000Z",
      query_since: "2026-09-18T10:00:00.000Z",
      observed_through: "2026-10-18T09:59:00.000Z",
      source_event_count: 12,
      returned_event_count: 12,
      truncated: false,
    },
    caveats: ["safe caveat", "x".repeat(1000)],
  }, new Request("https://example.test/api/v2/overview"));
  assert.deepEqual(body.range, { days: 30, from: "2026-09-18T10:00:00.000Z", to: "2026-10-18T10:00:00.000Z" });
  assert.deepEqual(body.scope, { type: "workspace", value: "authenticated" });
  assert.equal(body.generated_at, "2026-10-18T10:00:00.000Z");
  assert.equal(body.freshness.lag_seconds, 60);
  assert.equal(body.source_count, 12);
  assert.equal(body.truncated, false);
  assert.equal(body.evidence_quality, "observed");
  assert.equal(body.classifier_version, "semantic:1");
  assert.equal(body.caveats[1].length, 500);
});

test("empty or truncated data is explicit", () => {
  const empty = withTrackMCPV2Envelope({ range_days: null, data_trust: { source_event_count: 0, returned_event_count: 0, truncated: false } }, new Request("https://example.test"));
  assert.equal(empty.evidence_quality, "insufficient_data");
  const truncated = withTrackMCPV2Envelope({ total_events: 10000, data_trust: { source_event_count: 10000, returned_event_count: 10000, truncated: true } }, new Request("https://example.test"));
  assert.equal(truncated.evidence_quality, "truncated");
  assert.equal(truncated.truncated, true);
});
