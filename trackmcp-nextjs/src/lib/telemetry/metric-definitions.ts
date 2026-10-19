/**
 * Product-facing definitions for the metrics shown in the dashboard.
 *
 * Keep these definitions deliberately conservative: a metric must identify its
 * source and limitations so that an inferred signal is never presented as a
 * verified business outcome. This registry is also a stable vocabulary for
 * future API/read-model work described in the Founder OS plan.
 */
export type MetricDefinition = {
  key: string;
  label: string;
  formula: string;
  source: string;
  interpretation: string;
  limitations: string[];
};

export const METRIC_DEFINITIONS = [
  {
    key: "ai_clients",
    label: "AI clients",
    formula: "count(distinct observed client_name)",
    source: "Server-observed telemetry events",
    interpretation: "Distinct client names reported at the server boundary.",
    limitations: [
      "A missing or unreported client name is not counted.",
      "This is not a count of unique end users.",
    ],
  },
  {
    key: "activity",
    label: "Activity",
    formula: "count(observed tool_call events)",
    source: "Tool-call telemetry",
    interpretation: "The number of tool calls observed in the selected period.",
    limitations: [
      "Calls that never reach the instrumented server are not observable.",
      "Retries are counted as calls and should be interpreted with retry rate.",
    ],
  },
  {
    key: "work_completed",
    label: "Work completed",
    formula: "count(workflow completed) / count(workflow started)",
    source: "Explicit workflow outcome events",
    interpretation: "The share of explicitly started workflows that emitted a completed outcome.",
    limitations: [
      "No session-based completion inference is used.",
      "N/A means no explicit workflow starts were observed, not zero completion.",
    ],
  },
  {
    key: "error_rate",
    label: "Error rate",
    formula: "count(failed observed calls) / count(observed calls)",
    source: "Tool-call telemetry with an explicit error state",
    interpretation: "The proportion of observed calls marked as failed.",
    limitations: [
      "Unknown outcomes are excluded from the numerator and denominator where the API supplies known-outcome counts.",
      "A low error rate does not prove a successful user outcome.",
    ],
  },
  {
    key: "needs_attention",
    label: "Needs attention",
    formula: "count(observed insight records)",
    source: "Bounded analytics insight rules",
    interpretation: "Signals that meet an observed threshold and may merit investigation.",
    limitations: [
      "This is a count of signals, not a severity score or diagnosis.",
      "No signal means no rule fired; it does not prove the system is healthy.",
    ],
  },
  {
    key: "identity_coverage",
    label: "Verified account coverage",
    formula: "count(events with account_identity_source=resolver) / count(events eligible for account identity)",
    source: "Resolver-labeled server telemetry events",
    interpretation: "The share of observed events linked to an already-validated customer account through the configured resolver.",
    limitations: [
      "Unresolved events remain visible and are not treated as a single anonymous customer.",
      "Coverage is event-weighted, not a count of unique organizations or end users.",
      "The resolver must be configured by the customer; TrackMCP does not infer identity from clientInfo or raw credentials.",
    ],
  },
] as const satisfies readonly MetricDefinition[];

export type MetricKey = (typeof METRIC_DEFINITIONS)[number]["key"];

export function getMetricDefinition(key: MetricKey): MetricDefinition {
  const definition = METRIC_DEFINITIONS.find((item) => item.key === key);
  if (!definition) throw new Error(`Unknown metric: ${key}`);
  return definition;
}
