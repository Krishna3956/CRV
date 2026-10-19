import assert from "node:assert/strict";
import test from "node:test";
import { ANALYTICS_WORKLOAD_LIMITS, assessAnalyticsWorkload } from "./analytics-workload-policy.ts";

test("bounded analytics stays within the current read contract", () => {
  assert.deepEqual(assessAnalyticsWorkload({ sourceRows: 100, requestedDays: 7, catalogRows: 40, catalogPageDepth: 0 }), { source_scan: "within_bound", catalog_read: "within_bound", rollup_review: false, cursor_review: false, reasons: [] });
});
test("near-cap and capped scans produce explicit migration triggers", () => {
  assert.equal(assessAnalyticsWorkload({ sourceRows: ANALYTICS_WORKLOAD_LIMITS.sourceScanWarningRows }).source_scan, "near_cap");
  const capped = assessAnalyticsWorkload({ sourceRows: ANALYTICS_WORKLOAD_LIMITS.sourceScanCapRows, requestedDays: 90 });
  assert.equal(capped.source_scan, "capped");
  assert.ok(capped.reasons.includes("source_scan_reached_safety_cap"));
  assert.ok(capped.reasons.includes("maximum_window_requested"));
});
test("pagination, rollup, and cursor thresholds are deterministic", () => {
  const result = assessAnalyticsWorkload({ sourceRows: 25_000, catalogRows: 101, catalogPageDepth: 50 });
  assert.equal(result.catalog_read, "paged");
  assert.equal(result.rollup_review, true);
  assert.equal(result.cursor_review, true);
  assert.equal(result.reasons.length, 4);
});
