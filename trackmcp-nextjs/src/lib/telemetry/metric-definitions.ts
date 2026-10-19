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
  {
    key: "active_accounts",
    label: "Active accounts this period",
    formula: "count(distinct resolver-linked account keys in selected period)",
    source: "Server telemetry with account_identity_source=resolver",
    interpretation: "The number of privacy-safe account signals observed in the selected window.",
    limitations: [
      "MCP does not define customer accounts; the customer's resolver supplies this dimension.",
      "This is not a count of people, companies, or verified end users.",
    ],
  },
  {
    key: "new_accounts",
    label: "New accounts",
    formula: "active resolver-linked accounts whose first observed timestamp falls in the selected period",
    source: "Bounded historical server telemetry scan",
    interpretation: "Resolver-linked accounts first observed during the selected window.",
    limitations: [
      "N/A is returned when the bounded historical scan is incomplete.",
      "First observed is not the same as account creation or customer signup.",
    ],
  },
  {
    key: "returning_accounts",
    label: "Returning accounts",
    formula: "active resolver-linked accounts first observed before the selected period",
    source: "Bounded historical server telemetry scan",
    interpretation: "Resolver-linked activity that predates the selected window.",
    limitations: [
      "N/A is returned when the bounded historical scan is incomplete.",
      "Repeat activity is not a retention or revenue claim.",
    ],
  },
  {
    key: "tool_call_volume",
    label: "Total tool calls",
    formula: "count(observed tools/call events)",
    source: "Tool-call telemetry",
    interpretation: "Observed feature activity in the selected period.",
    limitations: [
      "Calls that never reach the instrumented server are not observable.",
      "Retries count as calls and should be interpreted with the reliability table.",
    ],
  },
  {
    key: "tool_error_rate",
    label: "Overall error rate",
    formula: "count(explicitly failed tool calls) / count(observed tool calls)",
    source: "Tool-call telemetry",
    interpretation: "The share of observed tool calls with an explicit error state.",
    limitations: [
      "Unknown outcomes are not silently treated as errors.",
      "An error-free tool call does not prove a successful business outcome.",
    ],
  },
  {
    key: "tool_adoption_breadth",
    label: "Average tools per account",
    formula: "average(distinct observed tools per resolver-linked account)",
    source: "Tool-call telemetry with resolver-linked account identity",
    interpretation: "Observed breadth of capability use among accounts with a configured resolver.",
    limitations: [
      "Accounts without a resolver are excluded rather than guessed.",
      "This is a usage-surface metric, not a demand, retention, or expansion score.",
    ],
  },
  {
    key: "resource_reads",
    label: "Resource reads",
    formula: "count(observed resources/read events)",
    source: "Protocol telemetry",
    interpretation: "Observed resource reads reaching the instrumented server.",
    limitations: ["Resource contents and raw URIs are never exposed.", "Calls that never reach the server are not observable."],
  },
  {
    key: "prompt_calls",
    label: "Prompt calls",
    formula: "count(observed prompts/get events)",
    source: "Protocol telemetry",
    interpretation: "Observed prompt retrieval calls reaching the instrumented server.",
    limitations: ["Prompt arguments and raw names are never exposed.", "A call is not proof that a user completed the resulting work."],
  },
  {
    key: "prompt_completion_rate",
    label: "Prompt completion rate",
    formula: "explicit complete prompt outcomes / observed prompt calls",
    source: "Prompt protocol telemetry",
    interpretation: "Explicitly reported prompt completion evidence.",
    limitations: ["N/A when no prompt calls exist.", "Unknown outcomes are not treated as completion or failure."],
  },
  {
    key: "prompt_stall_rate",
    label: "Prompt needs-input rate",
    formula: "input_required prompt outcomes / observed prompt calls",
    source: "Prompt protocol telemetry",
    interpretation: "Explicit prompt calls that require more input.",
    limitations: ["Needs-input is friction evidence, not abandonment or failure."],
  },
  {
    key: "typical_journey_length",
    label: "Typical journey length",
    formula: "median observed tool steps per bounded interaction",
    source: "Interaction-linked tool telemetry",
    interpretation: "Typical length of the visible server-side path.",
    limitations: ["N/A with no interactions.", "Multi-server work and missing terminal events are not visible."],
  },
  {
    key: "journey_stall_rate",
    label: "Journey waiting-for-input rate",
    formula: "interactions with explicit input_required / observed interactions",
    source: "Interaction-linked protocol telemetry",
    interpretation: "Observed friction where the server requested more input.",
    limitations: ["Needs-input is not abandonment or business failure.", "Only explicit protocol evidence is counted."],
  },
] as const satisfies readonly MetricDefinition[];

export type MetricKey = (typeof METRIC_DEFINITIONS)[number]["key"];

export function getMetricDefinition(key: MetricKey): MetricDefinition {
  const definition = METRIC_DEFINITIONS.find((item) => item.key === key);
  if (!definition) throw new Error(`Unknown metric: ${key}`);
  return definition;
}
