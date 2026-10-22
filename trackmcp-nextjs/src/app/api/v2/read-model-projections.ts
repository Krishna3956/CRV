const boundedInt = (value: unknown, max = 1000000) => typeof value === "number" && Number.isSafeInteger(value) ? Math.max(0, Math.min(max, value)) : 0;
const boundedRate = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : null;
const boundedText = (value: unknown, max = 128) => typeof value === "string" ? value.slice(0, max) : null;

function projectEntityAnalytics(value: unknown) {
  const row = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const status = boundedText(row.status, 32) || "schema_unavailable";
  return {
    status,
    read_events: boundedInt(row.read_events),
    successful_reads: boundedInt(row.successful_reads),
    failed_reads: boundedInt(row.failed_reads),
    input_required_reads: boundedInt(row.input_required_reads),
  };
}

export function projectObservedSurface(value: unknown, fallback: Record<string, unknown>) {
  const row = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : fallback;
  return {
    events: boundedInt(row.events),
    methods: Array.isArray(row.methods) ? row.methods.filter((method): method is string => typeof method === "string").map((method) => method.slice(0, 64)).slice(0, 32) : [],
    entity_count: boundedInt(row.entity_count),
    entity_analytics: projectEntityAnalytics(row.entity_analytics),
  };
}

export function projectReadActivity(source: Record<string, unknown> | undefined, kind: "resource" | "prompt") {
  if (!source) return null;
  const prefix = kind === "resource" ? "resource" : "prompt";
  const outcomes = Array.isArray(source.outcomes) ? source.outcomes.slice(0, 32).flatMap((value): Record<string, unknown>[] => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return [];
    const row = value as Record<string, unknown>;
    return row.kind === kind ? [{ kind, interactions: boundedInt(row.interactions), complete: boundedInt(row.complete), stalled: boundedInt(row.stalled), errored: boundedInt(row.errored), unknown: boundedInt(row.unknown), linked_retry_count: boundedInt(row.linked_retry_count) }] : [];
  }) : [];
  const breakdownKey = `${prefix}_breakdown`;
  const trend = Array.isArray(source.trend) ? source.trend.slice(0, 90).flatMap((value): Record<string, unknown>[] => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return [];
    const row = value as Record<string, unknown>;
    return row.kind === kind ? [{ kind, name: boundedText(row.name), calls: boundedInt(row.calls) }] : [];
  }) : [];
  const breakdown = Array.isArray(source[breakdownKey]) ? source[breakdownKey].slice(0, 100).flatMap((value): Record<string, unknown>[] => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return [];
    const row = value as Record<string, unknown>;
    return [{ name: boundedText(row.name), calls: boundedInt(row.calls), share: boundedRate(row.share), completion_rate: boundedRate(row.completion_rate), stall_rate: boundedRate(row.stall_rate), error_rate: boundedRate(row.error_rate), unknown_rate: boundedRate(row.unknown_rate) }];
  }) : [];
  return {
    interactions: boundedInt(source[`${prefix}_reads`] ?? source[`${prefix}_calls`]),
    observations: boundedInt(source[`${prefix}_observations`]),
    previous_period_interactions: boundedInt(source[`previous_period_${prefix}_${kind === "resource" ? "reads" : "calls"}`]),
    completion_rate: boundedRate(source[`${prefix}_completion_rate`]),
    input_required_rate: boundedRate(source[`${prefix}_stall_rate`]),
    error_rate: boundedRate(source[`${prefix}_error_rate`]),
    outcomes,
    method_breakdown: breakdown,
    trend,
  };
}
