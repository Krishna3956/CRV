import { percentile } from "./analytics.ts";

export const REGRESSION_METRICS = [
  "tool_error_rate_spike",
  "p95_latency_regression",
  "empty_result_spike",
  "retry_loop_spike",
  "catalog_description_drift",
  "workflow_completion_drop",
  "authorization_failure_spike",
  "deployment_comparison",
] as const;
export type RegressionMetric = (typeof REGRESSION_METRICS)[number];
export type AlertSeverity = "warning" | "critical";
export type AlertDataStatus = "sufficient" | "insufficient_data" | "partial";
export type RegressionReason =
  | "below_minimum_volume"
  | "missing_grouping"
  | "missing_catalog_hash"
  | "missing_deployment_id"
  | "truncated_scan"
  | "unknown_outcomes"
  | "retention_gap"
  | "missing_authorization_outcome";

export const BASELINE_DAYS = 7;
export const COMPARISON_DAYS = 1;
export const MIN_ELIGIBLE_CALLS = 30;
export const MIN_WORKFLOW_STARTS = 20;
export const MIN_CATALOG_SIDE_CALLS = 30;
export const COOLDOWN_HOURS = 6;
export const POLICY_VERSION = "p1-05-v1";

export type RegressionEvent = {
  event_id?: string | null;
  event_type?: string | null;
  environment?: string | null;
  deployment_id?: string | null;
  observation_source?: "client" | "server" | null;
  session_id?: string | null;
  correlation_handle?: string | null;
  workflow_id?: string | null;
  tool_name?: string | null;
  started_at?: string | null;
  duration_ms?: number | null;
  success?: boolean | null;
  is_error?: boolean | null;
  error_class?: string | null;
  error_code?: number | null;
  retry_number?: number | null;
  payload_policy?: string | null;
  payload?: Record<string, unknown> | null;
};

export type RegressionWindow = {
  start: string;
  end: string;
};

export type RegressionSummary = {
  numerator: number;
  denominator: number;
  value: number | null;
  window: RegressionWindow;
};

export type RegressionFinding = {
  metric: RegressionMetric;
  severity: AlertSeverity | null;
  data_status: AlertDataStatus;
  reasons: RegressionReason[];
  baseline: RegressionSummary;
  comparison: RegressionSummary;
  threshold: Record<string, number>;
  scope: { tool_name: string | null; environment: string | null };
  evidence: { catalog_changed?: boolean; previous_deployment_id?: string | null; comparison_deployment_id?: string | null };
};

export type RegressionWindows = { baseline: RegressionWindow; comparison: RegressionWindow };
type WindowBounds = { start: number; end: number; public: RegressionWindow };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function time(event: RegressionEvent): number | null {
  if (!event.started_at) return null;
  const value = Date.parse(event.started_at);
  return Number.isFinite(value) ? value : null;
}

function bounds(now: Date): { baseline: WindowBounds; comparison: WindowBounds } {
  const end = new Date(now);
  end.setUTCHours(0, 0, 0, 0);
  const comparisonStart = new Date(end);
  comparisonStart.setUTCDate(comparisonStart.getUTCDate() - COMPARISON_DAYS);
  const baselineStart = new Date(comparisonStart);
  baselineStart.setUTCDate(baselineStart.getUTCDate() - BASELINE_DAYS);
  return {
    baseline: { start: baselineStart.getTime(), end: comparisonStart.getTime(), public: { start: baselineStart.toISOString(), end: comparisonStart.toISOString() } },
    comparison: { start: comparisonStart.getTime(), end: end.getTime(), public: { start: comparisonStart.toISOString(), end: end.toISOString() } },
  };
}

export function regressionWindows(now = new Date()): RegressionWindows {
  const window = bounds(now);
  return { baseline: window.baseline.public, comparison: window.comparison.public };
}

function inWindow(event: RegressionEvent, window: WindowBounds): boolean {
  const at = time(event);
  return at !== null && at >= window.start && at < window.end;
}

function failed(event: RegressionEvent): boolean {
  return event.is_error === true || event.success === false;
}

function knownOutcome(event: RegressionEvent): boolean {
  return typeof event.success === "boolean" || typeof event.is_error === "boolean";
}

function successful(event: RegressionEvent): boolean {
  return knownOutcome(event) && !failed(event);
}

function isTruncated(value: unknown, seen = new Set<object>()): boolean {
  if (Array.isArray(value)) {
    if (seen.has(value)) return false;
    seen.add(value);
    return value.some((item) => isTruncated(item, seen));
  }
  if (!isRecord(value)) return false;
  if (seen.has(value)) return false;
  seen.add(value);
  return value.truncated === true || value.__trackmcp_truncated === true || value._truncated === true || Object.values(value).some((item) => isTruncated(item, seen));
}

function structurallyEmpty(value: unknown): boolean {
  if (value === null) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (!isRecord(value)) return false;
  if (Array.isArray(value.content)) return value.content.length === 0;
  if (Object.hasOwn(value, "structuredContent") && structurallyEmpty(value.structuredContent)) return true;
  return Object.keys(value).length === 0;
}

function inspectableEmpty(event: RegressionEvent): boolean {
  return successful(event)
    && event.payload_policy !== "metadata"
    && event.payload_policy !== "unavailable"
    && event.payload_policy !== "truncated"
    && Boolean(event.payload && Object.hasOwn(event.payload, "result"))
    && !isTruncated(event.payload)
    && structurallyEmpty(event.payload?.result);
}

function inspectableSuccess(event: RegressionEvent): boolean {
  return successful(event)
    && event.payload_policy !== "metadata"
    && event.payload_policy !== "unavailable"
    && event.payload_policy !== "truncated"
    && Boolean(event.payload && Object.hasOwn(event.payload, "result"))
    && !isTruncated(event.payload);
}

function eligibleCalls(events: readonly RegressionEvent[], toolName: string | null, environment: string | null): RegressionEvent[] {
  return events.filter((event) => event.observation_source === "server"
    && event.event_type === "tool_call"
    && Boolean(event.tool_name)
    && (!toolName || event.tool_name === toolName)
    && (!environment || event.environment === environment));
}

function summary(window: WindowBounds, numerator: number, denominator: number, value: number | null): RegressionSummary {
  return { numerator, denominator, value, window: window.public };
}

function rateFinding(metric: RegressionMetric, baseline: RegressionSummary, comparison: RegressionSummary, scope: RegressionFinding["scope"], reasons: RegressionReason[] = []): RegressionFinding {
  const threshold = { warning_delta: 0.1, warning_multiple: 1.5, critical_delta: 0.2, critical_multiple: 2, zero_baseline_warning: 0.2, zero_baseline_critical: 0.4 };
  if (reasons.length || baseline.denominator < MIN_ELIGIBLE_CALLS || comparison.denominator < MIN_ELIGIBLE_CALLS || baseline.value === null || comparison.value === null) {
    return { metric, severity: null, data_status: "insufficient_data", reasons: [...new Set(reasons.concat(baseline.denominator < MIN_ELIGIBLE_CALLS || comparison.denominator < MIN_ELIGIBLE_CALLS ? ["below_minimum_volume"] : []))], baseline, comparison, threshold, scope, evidence: {} };
  }
  const delta = comparison.value - baseline.value;
  const multiple = baseline.value === 0 ? Number.POSITIVE_INFINITY : comparison.value / baseline.value;
  const severity = delta >= threshold.critical_delta && multiple >= threshold.critical_multiple || baseline.value === 0 && comparison.value >= threshold.zero_baseline_critical
    ? "critical"
    : delta >= threshold.warning_delta && multiple >= threshold.warning_multiple || baseline.value === 0 && comparison.value >= threshold.zero_baseline_warning
      ? "warning"
      : null;
  return { metric, severity, data_status: "sufficient", reasons: [], baseline, comparison, threshold, scope, evidence: {} };
}

function p95Finding(metric: RegressionMetric, baseline: RegressionSummary, comparison: RegressionSummary, scope: RegressionFinding["scope"], reasons: RegressionReason[] = []): RegressionFinding {
  const threshold = { warning_multiple: 1.5, warning_delta_ms: 100, critical_multiple: 2, critical_delta_ms: 250, zero_baseline_warning_ms: 500, zero_baseline_critical_ms: 1000 };
  if (reasons.length || baseline.denominator < MIN_ELIGIBLE_CALLS || comparison.denominator < MIN_ELIGIBLE_CALLS || baseline.value === null || comparison.value === null) {
    return { metric, severity: null, data_status: "insufficient_data", reasons: [...new Set(reasons.concat(baseline.denominator < MIN_ELIGIBLE_CALLS || comparison.denominator < MIN_ELIGIBLE_CALLS ? ["below_minimum_volume"] : []))], baseline, comparison, threshold, scope, evidence: {} };
  }
  const delta = comparison.value - baseline.value;
  const multiple = baseline.value === 0 ? Number.POSITIVE_INFINITY : comparison.value / baseline.value;
  const severity = baseline.value === 0 && comparison.value >= threshold.zero_baseline_critical_ms || multiple >= threshold.critical_multiple && delta >= threshold.critical_delta_ms
    ? "critical"
    : baseline.value === 0 && comparison.value >= threshold.zero_baseline_warning_ms || multiple >= threshold.warning_multiple && delta >= threshold.warning_delta_ms
      ? "warning"
      : null;
  return { metric, severity, data_status: "sufficient", reasons: [], baseline, comparison, threshold, scope, evidence: {} };
}

function scopedEvent(event: RegressionEvent, scope: RegressionFinding["scope"]): boolean {
  if (event.observation_source !== "server") return false;
  if (scope.environment && event.environment !== scope.environment) return false;
  if (!scope.tool_name) return true;
  const payloadTool = isRecord(event.payload) && typeof event.payload.tool_name === "string" ? event.payload.tool_name : null;
  return event.tool_name === scope.tool_name || payloadTool === scope.tool_name;
}

function workflowSummary(events: readonly RegressionEvent[], window: WindowBounds, scope: RegressionFinding["scope"]): RegressionSummary {
  const groups = new Map<string, RegressionEvent[]>();
  for (const event of events) if (event.workflow_id && scopedEvent(event, scope)) groups.set(event.workflow_id, [...(groups.get(event.workflow_id) || []), event]);
  let started = 0;
  let completed = 0;
  for (const group of groups.values()) {
    const lifecycle = group.filter((event) => (event.event_type === "workflow" || event.event_type === "custom") && event.payload?.name === "workflow" && typeof event.payload.status === "string");
    const start = lifecycle.filter((event) => event.payload?.status === "started").sort((a, b) => (time(a) || 0) - (time(b) || 0))[0];
    if (!start || !inWindow(start, window)) continue;
    started += 1;
    const terminal = lifecycle.filter((event) => (event.payload?.status === "completed" || event.payload?.status === "failed") && (time(event) || 0) >= (time(start) || 0)).sort((a, b) => (time(a) || 0) - (time(b) || 0)).at(-1);
    if (terminal) completed += terminal.payload?.status === "completed" ? 1 : 0;
  }
  return summary(window, completed, started, started ? completed / started : null);
}

function authorizationSummary(events: readonly RegressionEvent[], window: WindowBounds, scope: RegressionFinding["scope"]): RegressionSummary {
  const attempts = events.filter((event) => inWindow(event, window) && scopedEvent(event, scope) && knownOutcome(event) && event.payload?.authorization_attempt === true);
  const failures = attempts.filter((event) => event.error_code === 401 || event.error_code === 403 || event.error_class === "authentication_error" || event.error_class === "authorization_error");
  return summary(window, failures.length, attempts.length, attempts.length ? failures.length / attempts.length : null);
}

function catalogHashes(event: RegressionEvent): Map<string, { description: string | null; schema: string | null }> {
  const result = isRecord(event.payload?.result) ? event.payload?.result : null;
  const values = Array.isArray(event.payload?.tools) ? event.payload.tools : result && Array.isArray(result.tools) ? result.tools : [];
  return new Map(values.flatMap((value) => {
    if (!isRecord(value) || typeof value.name !== "string") return [];
    return [[value.name, { description: typeof value.tool_description_hash === "string" ? value.tool_description_hash : null, schema: typeof value.schema_hash === "string" ? value.schema_hash : null }]] as const;
  }));
}

function catalogFinding(events: readonly RegressionEvent[], window: { baseline: WindowBounds; comparison: WindowBounds }, scope: RegressionFinding["scope"]): RegressionFinding {
  const threshold = { minimum_side_calls: MIN_CATALOG_SIDE_CALLS };
  const catalogs = events.filter((event) => event.observation_source === "server" && (event.event_type === "catalog" || event.event_type === "custom") && event.payload?.name === "tools_discovered" && (!scope.environment || event.environment === scope.environment) && inWindow(event, window.comparison));
  const target = scope.tool_name;
  let changed = false;
  let before = 0;
  let after = 0;
  for (const catalog of catalogs) {
    const currentHashes = catalogHashes(catalog);
    const candidateNames = target ? [target] : [...currentHashes.keys()];
    const prior = events.filter((event) => event.observation_source === "server" && (event.event_type === "catalog" || event.event_type === "custom") && event.payload?.name === "tools_discovered" && (!scope.environment || event.environment === scope.environment) && (time(event) || 0) < (time(catalog) || 0)).sort((a, b) => (time(b) || 0) - (time(a) || 0))[0];
    const previousHashes = prior ? catalogHashes(prior) : new Map<string, { description: string | null; schema: string | null }>();
    for (const candidate of candidateNames) {
      const hashes = currentHashes.get(candidate);
      const priorHashes = previousHashes.get(candidate);
      if (!hashes || (!hashes.description && !hashes.schema) || !priorHashes || (priorHashes.description === hashes.description && priorHashes.schema === hashes.schema)) continue;
      changed = true;
      before = events.filter((event) => event.event_type === "tool_call" && event.observation_source === "server" && event.tool_name === candidate && inWindow(event, window.baseline) && (time(event) || 0) < (time(catalog) || 0)).length;
      after = events.filter((event) => event.event_type === "tool_call" && event.observation_source === "server" && event.tool_name === candidate && inWindow(event, window.comparison) && (time(event) || 0) >= (time(catalog) || 0)).length;
      break;
    }
    if (changed) break;
  }
  const baseline = summary(window.baseline, before, before, before ? 0 : null);
  const comparison = summary(window.comparison, changed ? 1 : 0, changed ? 1 : 0, changed ? 1 : 0);
  if (!changed) return { metric: "catalog_description_drift", severity: null, data_status: "insufficient_data", reasons: ["missing_catalog_hash"], baseline, comparison, threshold, scope, evidence: { catalog_changed: false } };
  const sufficient = before >= MIN_CATALOG_SIDE_CALLS && after >= MIN_CATALOG_SIDE_CALLS;
  return { metric: "catalog_description_drift", severity: sufficient ? "warning" : null, data_status: sufficient ? "sufficient" : "insufficient_data", reasons: sufficient ? [] : ["below_minimum_volume"], baseline: { ...baseline, denominator: before }, comparison: { ...comparison, denominator: after }, threshold, scope, evidence: { catalog_changed: true } };
}

function deploymentFinding(events: readonly RegressionEvent[], window: { baseline: WindowBounds; comparison: WindowBounds }, scope: RegressionFinding["scope"]): RegressionFinding {
  const deploymentAt = (range: WindowBounds) => [...new Set(events.filter((event) => inWindow(event, range) && event.observation_source === "server" && event.event_type === "tool_call" && event.deployment_id && (!scope.tool_name || event.tool_name === scope.tool_name) && (!scope.environment || event.environment === scope.environment)).map((event) => event.deployment_id!))]
    .map((id) => ({ id, at: Math.max(...events.filter((event) => event.deployment_id === id && inWindow(event, range)).map((event) => time(event) || 0)) }))
    .sort((a, b) => b.at - a.at);
  const currentId = deploymentAt(window.comparison)[0]?.id;
  const previousId = deploymentAt(window.baseline)[0]?.id;
  const byDeployment = (deploymentId: string | undefined, range: WindowBounds) => {
    const calls = events.filter((event) => inWindow(event, range) && event.observation_source === "server" && event.event_type === "tool_call" && event.deployment_id === deploymentId && (!scope.tool_name || event.tool_name === scope.tool_name) && (!scope.environment || event.environment === scope.environment));
    const known = calls.filter(knownOutcome);
    const value = known.length ? known.filter(failed).length / known.length : null;
    return { numerator: known.filter(failed).length, denominator: known.length, value };
  };
  const b = byDeployment(previousId, window.baseline);
  const c = byDeployment(currentId, window.comparison);
  const baseline = summary(window.baseline, b.numerator, b.denominator, b.value);
  const comparison = summary(window.comparison, c.numerator, c.denominator, c.value);
  const finding = rateFinding("deployment_comparison", baseline, comparison, scope, currentId && previousId ? [] : ["missing_deployment_id"]);
  return { ...finding, evidence: { previous_deployment_id: previousId || null, comparison_deployment_id: currentId || null } };
}

export function evaluateRegressions(events: readonly RegressionEvent[], options: { now?: Date; metric?: RegressionMetric; toolName?: string | null; environment?: string | null; truncated?: boolean } = {}): RegressionFinding[] {
  const window = bounds(options.now || new Date());
  const scope = { tool_name: options.toolName || null, environment: options.environment || null };
  const unique = [...new Map(events.filter((event) => event.event_id).map((event) => [event.event_id, event])).values()];
  const calls = eligibleCalls(unique, scope.tool_name, scope.environment);
  const makeRate = (metric: RegressionMetric, selector: (event: RegressionEvent) => { numerator: boolean; denominator: boolean }) => {
    const forWindow = (range: WindowBounds) => {
      const selected = calls.filter((event) => inWindow(event, range));
      const values = selected.map(selector);
      return summary(range, values.filter((value) => value.numerator).length, values.filter((value) => value.denominator).length, values.some((value) => value.denominator) ? values.filter((value) => value.numerator).length / values.filter((value) => value.denominator).length : null);
    };
    const finding = rateFinding(metric, forWindow(window.baseline), forWindow(window.comparison), scope);
    return options.truncated ? { ...finding, severity: null, data_status: "partial" as const, reasons: ["truncated_scan" as const] } : finding;
  };
  const makeP95 = () => {
    const values = (range: WindowBounds) => calls.filter((event) => inWindow(event, range) && typeof event.duration_ms === "number" && Number.isFinite(event.duration_ms) && event.duration_ms >= 0).map((event) => event.duration_ms!);
    const baseline = values(window.baseline);
    const comparison = values(window.comparison);
    const finding = p95Finding("p95_latency_regression", summary(window.baseline, baseline.length, baseline.length, percentile(baseline, 0.95)), summary(window.comparison, comparison.length, comparison.length, percentile(comparison, 0.95)), scope);
    return options.truncated ? { ...finding, severity: null, data_status: "partial" as const, reasons: ["truncated_scan" as const] } : finding;
  };
  const makeCompletion = () => {
    const baseline = workflowSummary(unique, window.baseline, scope);
    const comparison = workflowSummary(unique, window.comparison, scope);
    const threshold = { warning_delta: 0.1, critical_delta: 0.2, minimum_workflow_starts: MIN_WORKFLOW_STARTS };
    const insufficient = baseline.denominator < MIN_WORKFLOW_STARTS || comparison.denominator < MIN_WORKFLOW_STARTS;
    const finding: RegressionFinding = { metric: "workflow_completion_drop", severity: !insufficient && comparison.value !== null && baseline.value !== null && baseline.value - comparison.value >= 0.2 ? "critical" : !insufficient && comparison.value !== null && baseline.value !== null && baseline.value - comparison.value >= 0.1 ? "warning" : null, data_status: insufficient ? "insufficient_data" : "sufficient", reasons: insufficient ? ["below_minimum_volume"] : [], baseline, comparison, threshold, scope, evidence: {} };
    return options.truncated ? { ...finding, severity: null, data_status: "partial" as const, reasons: ["truncated_scan" as const] } : finding;
  };
  const makeAuth = () => {
    const finding = rateFinding("authorization_failure_spike", authorizationSummary(unique, window.baseline, scope), authorizationSummary(unique, window.comparison, scope), scope, []);
    return options.truncated ? { ...finding, severity: null, data_status: "partial" as const, reasons: ["truncated_scan" as const] } : finding;
  };
  const all: RegressionFinding[] = [
    makeRate("tool_error_rate_spike", (event) => ({ numerator: failed(event), denominator: knownOutcome(event) })),
    makeP95(),
    makeRate("empty_result_spike", (event) => ({ numerator: inspectableEmpty(event), denominator: inspectableSuccess(event) })),
    makeRate("retry_loop_spike", (event) => ({ numerator: typeof event.retry_number === "number" && event.retry_number > 0, denominator: typeof event.retry_number === "number" && Number.isFinite(event.retry_number) && event.retry_number >= 0 })),
    catalogFinding(unique, window, scope),
    makeCompletion(),
    makeAuth(),
    deploymentFinding(unique, window, scope),
  ];
  const selected = options.metric ? all.filter((finding) => finding.metric === options.metric) : all;
  return options.truncated ? selected.map((finding) => ({ ...finding, severity: null, data_status: "partial" as const, reasons: ["truncated_scan" as const] })) : selected;
}
