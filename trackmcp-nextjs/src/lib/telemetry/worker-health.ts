/**
 * Secret-free worker health evaluation.
 *
 * This module is deliberately an evaluation contract, not a scheduler or a
 * notification transport. It accepts bounded status summaries and produces
 * deterministic findings that a dashboard/alert adapter can consume without
 * exposing payloads, keys, customer identifiers, or error bodies.
 */

export type WorkerHealthEvent = {
  state?: unknown;
  queued_at?: unknown;
  completed_at?: unknown;
  attempts?: unknown;
};

export type WorkerHealthFinding = {
  metric: "backlog" | "lag" | "dead_letter" | "success_rate";
  state: "insufficient_data" | "normal" | "warning" | "critical";
  sample_count: number;
  value: number | null;
  threshold: { warning: number; critical: number };
  unit: "jobs" | "minutes" | "ratio";
  reasons: string[];
};

export type WorkerHealthThresholds = {
  backlogWarning: number;
  backlogCritical: number;
  lagWarningMinutes: number;
  lagCriticalMinutes: number;
  deadLetterWarning: number;
  deadLetterCritical: number;
  successWarningRatio: number;
  successCriticalRatio: number;
  minimumSample: number;
};

export const DEFAULT_WORKER_HEALTH_THRESHOLDS: WorkerHealthThresholds = {
  backlogWarning: 25,
  backlogCritical: 100,
  lagWarningMinutes: 5,
  lagCriticalMinutes: 15,
  deadLetterWarning: 1,
  deadLetterCritical: 5,
  successWarningRatio: 0.95,
  successCriticalRatio: 0.8,
  minimumSample: 10,
};

const timestamp = (value: unknown): number | null => {
  if (typeof value !== "string") return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
};

function state(value: unknown): "queued" | "running" | "completed" | "failed" | "dead_letter" | "unknown" {
  return value === "queued" || value === "running" || value === "completed" || value === "failed" || value === "dead_letter" ? value : "unknown";
}

function finding(
  metric: WorkerHealthFinding["metric"],
  value: number | null,
  sampleCount: number,
  threshold: { warning: number; critical: number },
  unit: WorkerHealthFinding["unit"],
  minimumSample: number,
  higherIsWorse: boolean,
): WorkerHealthFinding {
  if (sampleCount < minimumSample) return { metric, state: "insufficient_data", sample_count: sampleCount, value, threshold, unit, reasons: ["below_minimum_volume"] };
  if (value === null) return { metric, state: "insufficient_data", sample_count: sampleCount, value, threshold, unit, reasons: ["missing_measurement"] };
  const critical = higherIsWorse ? value >= threshold.critical : value <= threshold.critical;
  const warning = higherIsWorse ? value >= threshold.warning : value <= threshold.warning;
  const level = critical ? "critical" : warning ? "warning" : "normal";
  return { metric, state: level, sample_count: sampleCount, value, threshold, unit, reasons: level === "normal" ? [] : ["threshold_breached"] };
}

export function evaluateWorkerHealth(events: readonly WorkerHealthEvent[], now = new Date(), thresholds: WorkerHealthThresholds = DEFAULT_WORKER_HEALTH_THRESHOLDS): WorkerHealthFinding[] {
  const nowMs = now.getTime();
  const bounded = events.slice(0, 10_000);
  const queued = bounded.filter((event) => state(event.state) === "queued");
  const deadLetter = bounded.filter((event) => state(event.state) === "dead_letter");
  const terminal = bounded.filter((event) => ["completed", "failed", "dead_letter"].includes(state(event.state)));
  const lagMinutes = queued
    .map((event) => timestamp(event.queued_at))
    .filter((value): value is number => value !== null && value <= nowMs)
    .map((value) => Math.max(0, (nowMs - value) / 60_000));
  const maxLag = lagMinutes.length ? Math.max(...lagMinutes) : null;
  const successful = terminal.filter((event) => state(event.state) === "completed").length;
  const successRatio = terminal.length ? successful / terminal.length : null;
  return [
    finding("backlog", queued.length, bounded.length, { warning: thresholds.backlogWarning, critical: thresholds.backlogCritical }, "jobs", thresholds.minimumSample, true),
    finding("lag", maxLag, queued.length, { warning: thresholds.lagWarningMinutes, critical: thresholds.lagCriticalMinutes }, "minutes", 1, true),
    finding("dead_letter", deadLetter.length, bounded.length, { warning: thresholds.deadLetterWarning, critical: thresholds.deadLetterCritical }, "jobs", thresholds.minimumSample, true),
    finding("success_rate", successRatio, terminal.length, { warning: thresholds.successWarningRatio, critical: thresholds.successCriticalRatio }, "ratio", thresholds.minimumSample, false),
  ];
}
