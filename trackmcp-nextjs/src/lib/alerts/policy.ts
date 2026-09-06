import { COOLDOWN_HOURS, POLICY_VERSION, REGRESSION_METRICS, type RegressionMetric } from "../telemetry/regressions.ts";

export const ALERT_POLICY_VERSION = POLICY_VERSION;
export const ALERT_COOLDOWN_MS = COOLDOWN_HOURS * 60 * 60 * 1000;
export const MAX_ALERTS_PAGE = 100;
export const DEFAULT_ALERTS_PAGE = 50;
export const MAX_DESTINATIONS_PER_ALERT = 10;
export const MAX_TOOL_NAME = 2048;
export const MAX_ENVIRONMENT = 128;
export const MAX_EVIDENCE_BYTES = 32 * 1024;
export const MAX_DELIVERY_ATTEMPTS = 4;
export const DELIVERY_TIMEOUT_MS = 5000;
export const DELIVERY_BACKOFF_MS = [60_000, 300_000, 1_800_000] as const;

export function isRegressionMetric(value: unknown): value is RegressionMetric {
  return typeof value === "string" && (REGRESSION_METRICS as readonly string[]).includes(value);
}

export function boundedOptionalString(value: unknown, maxBytes: number): string | null | undefined {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" || value.trim() !== value || value.length === 0 || new TextEncoder().encode(value).byteLength > maxBytes) return undefined;
  return value;
}

export function parsePage(value: string | null): number {
  const parsed = value === null ? DEFAULT_ALERTS_PAGE : Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 1 ? Math.min(parsed, MAX_ALERTS_PAGE) : DEFAULT_ALERTS_PAGE;
}

export function stableAlertIdentity(workspaceId: string, alertId: string, metric: string, toolName: string | null, environment: string | null): string {
  return [workspaceId, alertId, metric, toolName || "*", environment || "*"].join("|");
}

export function evaluationKey(alertId: string, start: string, end: string): string {
  return [alertId, start, end, ALERT_POLICY_VERSION].join("|");
}
