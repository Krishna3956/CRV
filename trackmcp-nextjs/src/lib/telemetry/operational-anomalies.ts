/**
 * Bounded, secret-free anomaly evaluator for operational response.
 *
 * This is an application-side signal contract. It does not persist incidents,
 * send notifications, or decide a customer-facing outage by itself.
 */
export type OperationalEvent = { status_code?: unknown; error_code?: unknown; started_at?: unknown; route?: unknown };
export type OperationalAnomalyFinding = {
  metric: "rate_limit_spike" | "authorization_anomaly" | "ingest_error_spike";
  state: "insufficient_data" | "normal" | "warning" | "critical";
  sample_count: number;
  failure_count: number;
  failure_rate: number | null;
  window_minutes: 15;
  reasons: string[];
};

const MIN_SAMPLE = 20;
const WINDOW_MS = 15 * 60_000;
const boundedStatus = (value: unknown): number | null => {
  const n = typeof value === "number" ? value : typeof value === "string" && /^\d{3}$/.test(value) ? Number(value) : NaN;
  return Number.isInteger(n) && n >= 100 && n <= 599 ? n : null;
};
const eventTime = (event: OperationalEvent) => typeof event.started_at === "string" ? Date.parse(event.started_at) : NaN;

function evaluate(events: readonly OperationalEvent[], now: Date, metric: OperationalAnomalyFinding["metric"], statuses: readonly number[] | ((status: number) => boolean), warningRate: number, criticalRate: number, warningCount: number, criticalCount: number, include: (event: OperationalEvent) => boolean = () => true): OperationalAnomalyFinding {
  const end = now.getTime();
  const inWindow = events.filter((event) => { const at = eventTime(event); return include(event) && Number.isFinite(at) && at >= end - WINDOW_MS && at <= end; });
  const matchesStatus = typeof statuses === "function" ? statuses : (status: number) => statuses.includes(status);
  const failures = inWindow.filter((event) => matchesStatus(boundedStatus(event.status_code ?? event.error_code) ?? -1));
  const sample_count = inWindow.length;
  const failure_count = failures.length;
  const failure_rate = sample_count ? failure_count / sample_count : null;
  if (sample_count < MIN_SAMPLE) return { metric, state: "insufficient_data", sample_count, failure_count, failure_rate, window_minutes: 15, reasons: ["below_minimum_volume"] };
  const state = failure_count >= criticalCount && (failure_rate ?? 0) >= criticalRate ? "critical" : failure_count >= warningCount && (failure_rate ?? 0) >= warningRate ? "warning" : "normal";
  return { metric, state, sample_count, failure_count, failure_rate, window_minutes: 15, reasons: state === "normal" ? [] : ["bounded_status_spike"] };
}

export function evaluateRateLimitAnomaly(events: readonly OperationalEvent[], now = new Date()): OperationalAnomalyFinding {
  return evaluate(events, now, "rate_limit_spike", [429], 0.05, 0.2, 10, 50);
}

export function evaluateAuthorizationAnomaly(events: readonly OperationalEvent[], now = new Date()): OperationalAnomalyFinding {
  return evaluate(events, now, "authorization_anomaly", [401, 403], 0.1, 0.25, 5, 20);
}

/**
 * Keeps ingest availability distinct from authorization and rate-limit signals.
 * Only a normalized route and status class are consumed; callers must never
 * attach event IDs, headers, keys, payloads, or error bodies to this input.
 */
export function evaluateIngestErrorAnomaly(events: readonly OperationalEvent[], now = new Date()): OperationalAnomalyFinding {
  return evaluate(
    events,
    now,
    "ingest_error_spike",
    (status) => status >= 500 && status <= 599,
    0.05,
    0.2,
    5,
    20,
    (event) => event.route === "/api/v1/ingest",
  );
}
