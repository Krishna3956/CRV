import assert from "node:assert/strict";
import test from "node:test";
import { createReliabilityHandler } from "./handlers.ts";

function analytics(timeline) {
  return new Response(JSON.stringify({
    range_days: 30,
    errors: 8,
    tool_calls: timeline.reduce((sum, row) => sum + row.calls, 0),
    completion_rate: null,
    completion_source: "none",
    correlation_quality: "missing",
    correlation_handle_source: "missing",
    timeline,
    data_trust: { source_count: 1, returned_count: 1, private_payload: "do-not-return", generated_at: "2026-01-02T00:00:00.000Z" },
  }), { status: 200, headers: { "content-type": "application/json" } });
}

test("reliability returns a sufficient bounded baseline comparison", async () => {
  const handler = createReliabilityHandler(async () => analytics([
    { date: "2026-01-01", calls: 40, errors: 2 },
    { date: "2026-01-02", calls: 50, errors: 10 },
  ]));
  const response = await handler(new Request("https://example.test/api/v2/reliability"));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.baseline_comparison.status, "sufficient");
  assert.equal(body.baseline_comparison.baseline.calls, 40);
  assert.equal(body.baseline_comparison.baseline.errors, 2);
  assert.equal(body.baseline_comparison.baseline.error_rate, 2 / 40);
  assert.equal(body.baseline_comparison.comparison.calls, 50);
  assert.equal(body.baseline_comparison.comparison.errors, 10);
  assert.equal(body.baseline_comparison.comparison.error_rate, 10 / 50);
  assert.ok(Math.abs(body.baseline_comparison.delta - 0.15) < 1e-9);
  assert.equal(body.data_trust.generated_at, "2026-01-02T00:00:00.000Z");
  assert.equal("private_payload" in body.data_trust, false);
});

test("reliability refuses to claim a comparison with sparse daily volume", async () => {
  const handler = createReliabilityHandler(async () => analytics([
    { date: "2026-01-01", calls: 4, errors: 1 },
    { date: "2026-01-02", calls: 5, errors: 2 },
  ]));
  const response = await handler(new Request("https://example.test/api/v2/reliability"));
  const body = await response.json();
  assert.equal(body.baseline_comparison.status, "insufficient_data");
  assert.equal(body.baseline_comparison.baseline.error_rate, null);
  assert.equal(body.baseline_comparison.comparison.error_rate, null);
});
