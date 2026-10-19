/** Review-only workload triggers; these are not runtime SLOs. */
export const ANALYTICS_WORKLOAD_LIMITS = Object.freeze({
  sourceScanWarningRows: 8_000,
  sourceScanCapRows: 10_000,
  catalogPageRows: 100,
  catalogSentinelRows: 101,
  catalogIdentityCap: 500,
  rollupReviewRowsPerWindow: 25_000,
  cursorReviewPageDepth: 50,
});

export type AnalyticsWorkloadAssessment = {
  source_scan: "within_bound" | "near_cap" | "capped";
  catalog_read: "within_bound" | "paged";
  rollup_review: boolean;
  cursor_review: boolean;
  reasons: string[];
};

const boundedInt = (value: unknown, max = Number.MAX_SAFE_INTEGER) =>
  typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(0, Math.floor(value))) : 0;

export function assessAnalyticsWorkload(input: { sourceRows?: number; requestedDays?: number; catalogRows?: number; catalogPageDepth?: number }): AnalyticsWorkloadAssessment {
  const sourceRows = boundedInt(input.sourceRows);
  const catalogRows = boundedInt(input.catalogRows);
  const catalogPageDepth = boundedInt(input.catalogPageDepth);
  const requestedDays = Math.min(90, Math.max(1, boundedInt(input.requestedDays, 90) || 1));
  const source_scan = sourceRows >= ANALYTICS_WORKLOAD_LIMITS.sourceScanCapRows ? "capped" : sourceRows >= ANALYTICS_WORKLOAD_LIMITS.sourceScanWarningRows ? "near_cap" : "within_bound";
  const catalog_read = catalogRows > ANALYTICS_WORKLOAD_LIMITS.catalogPageRows ? "paged" : "within_bound";
  const rollup_review = sourceRows >= ANALYTICS_WORKLOAD_LIMITS.rollupReviewRowsPerWindow;
  const cursor_review = catalogPageDepth >= ANALYTICS_WORKLOAD_LIMITS.cursorReviewPageDepth;
  const reasons: string[] = [];
  if (source_scan === "near_cap") reasons.push("source_scan_near_safety_cap");
  if (source_scan === "capped") reasons.push("source_scan_reached_safety_cap");
  if (catalog_read === "paged") reasons.push("catalog_read_requires_pagination");
  if (rollup_review) reasons.push("rollup_review_threshold_reached");
  if (cursor_review) reasons.push("cursor_depth_review_threshold_reached");
  if (requestedDays === 90 && sourceRows > 0) reasons.push("maximum_window_requested");
  return { source_scan, catalog_read, rollup_review, cursor_review, reasons };
}
