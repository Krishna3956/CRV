import { NextResponse } from "next/server.js";
import { createAnalyticsHandler } from "../../v1/analytics/handlers.ts";
import { withTrackMCPV2Envelope } from "../../../../lib/api/v2-envelope.ts";
import { projectTrackMCPDataTrust } from "../../../../lib/telemetry/data-trust.ts";

const MIN_COMPARISON_CALLS = 30;

type TimelineRow = { date: string; calls: number; errors: number };

function timelineRows(value: unknown): TimelineRow[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const item = row as Record<string, unknown>;
    if (typeof item.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(item.date)) return [];
    const calls = typeof item.calls === "number" && Number.isFinite(item.calls) && item.calls >= 0 ? Math.floor(item.calls) : 0;
    const errors = typeof item.errors === "number" && Number.isFinite(item.errors) && item.errors >= 0 ? Math.min(calls, Math.floor(item.errors)) : 0;
    return [{ date: item.date, calls, errors }];
  }).sort((a, b) => a.date.localeCompare(b.date));
}

function observedComparison(rows: TimelineRow[]) {
  const observed = rows.filter((row) => row.calls > 0);
  const comparison = observed.at(-1) || null;
  const baselineRows = comparison ? observed.filter((row) => row.date < comparison.date).slice(-7) : [];
  const baselineCalls = baselineRows.reduce((sum, row) => sum + row.calls, 0);
  const baselineErrors = baselineRows.reduce((sum, row) => sum + row.errors, 0);
  const comparisonCalls = comparison?.calls || 0;
  const comparisonErrors = comparison?.errors || 0;
  const baselineRate = baselineCalls >= MIN_COMPARISON_CALLS ? baselineErrors / baselineCalls : null;
  const comparisonRate = comparisonCalls >= MIN_COMPARISON_CALLS ? comparisonErrors / comparisonCalls : null;
  const sufficient = baselineRate !== null && comparisonRate !== null;
  return {
    status: sufficient ? "sufficient" as const : observed.length ? "insufficient_data" as const : "no_observations" as const,
    minimum_calls: MIN_COMPARISON_CALLS,
    baseline: { dates: baselineRows.map((row) => row.date), errors: baselineErrors, calls: baselineCalls, error_rate: baselineRate },
    comparison: { date: comparison?.date || null, errors: comparisonErrors, calls: comparisonCalls, error_rate: comparisonRate },
    delta: baselineRate !== null && comparisonRate !== null ? comparisonRate - baselineRate : null,
  };
}

/**
 * Conservative reliability projection. It reports observed evidence and
 * preserves unknown/null values rather than turning missing evidence into
 * healthy or failed states.
 */
export function createReliabilityHandler(analytics = createAnalyticsHandler()) {
  return async function GET(request: Request) {
    const response = await analytics(request);
    if (!response.ok) return response;
    const body = await response.json() as {
      range_days?: unknown;
      errors?: unknown;
      tool_calls?: unknown;
      completion_rate?: unknown;
      completion_source?: unknown;
      correlation_quality?: unknown;
      correlation_handle_source?: unknown;
      timeline?: unknown;
      data_trust?: unknown;
    };
    const timeline = timelineRows(body.timeline).slice(-90);
    const toolCalls = typeof body.tool_calls === "number" ? body.tool_calls : null;
    // A timeline row may contain protocol/session activity without a single
    // tool call. Those rows are useful context but cannot establish a
    // reliability denominator. Require two distinct observed tool-call days.
    const observedToolCallDays = timeline.filter((row) => Boolean(row && typeof row === "object" && typeof (row as { calls?: unknown }).calls === "number" && (row as { calls: number }).calls > 0)).length;
    const comparisonReady = observedToolCallDays >= 2;
    const comparison = observedComparison(timeline);
    return NextResponse.json(withTrackMCPV2Envelope({
      range_days: typeof body.range_days === "number" ? body.range_days : null,
      observed: {
        errors: typeof body.errors === "number" ? body.errors : null,
        tool_calls: typeof body.tool_calls === "number" ? body.tool_calls : null,
        completion_rate: typeof body.completion_rate === "number" ? body.completion_rate : null,
        completion_source: body.completion_source ?? "not_observable",
        correlation_quality: body.correlation_quality ?? "unknown",
        correlation_handle_source: body.correlation_handle_source ?? "missing",
      },
      timeline,
      evidence: {
        state: toolCalls === null || toolCalls === 0 ? "insufficient_data" : comparisonReady ? "observed" : "partial",
        denominator: toolCalls,
        comparison_ready: comparisonReady,
        limitation: comparisonReady ? "Observed timeline has at least two tool-call days; this is not infrastructure uptime." : "A baseline comparison needs at least two observed days with tool-call evidence.",
      },
      baseline_comparison: comparison,
      data_trust: projectTrackMCPDataTrust(body.data_trust),
      caveats: [
        "Reliability describes observed telemetry, not infrastructure uptime.",
        "Completion is null when the selected evidence does not support an outcome claim.",
        "Counts are scoped to the authenticated workspace and selected time range.",
        "Baseline and comparison rates use observed daily tool-call aggregates only; they are not infrastructure uptime or a causal deployment analysis.",
      ],
    }, request));
  };
}

export const GET = createReliabilityHandler();
