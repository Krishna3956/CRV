import type { AlertDataStatus, AlertSeverity, RegressionMetric, RegressionReason, RegressionSummary } from "../telemetry/regressions.ts";

export type AlertState = "pending" | "firing" | "resolved" | "suppressed" | "insufficient_data" | "invalid_configuration";
export type AlertDestinationKind = "webhook" | "email";

export type AlertScope = {
  tool_name: string | null;
  environment: string | null;
};

export type AlertConfiguration = {
  id: string;
  workspace_id: string;
  metric: RegressionMetric;
  tool_name: string | null;
  environment: string | null;
  destination_ids: string[];
  policy_version: string;
  enabled: boolean;
  paused: boolean;
  created_at: string;
  updated_at: string;
};

export type AlertIncident = {
  id: string;
  workspace_id: string;
  alert_id: string;
  identity: string;
  metric: RegressionMetric;
  state: AlertState;
  severity: AlertSeverity | null;
  scope: AlertScope;
  data_status: AlertDataStatus;
  baseline: RegressionSummary | null;
  comparison: RegressionSummary | null;
  threshold: Record<string, number>;
  reasons: RegressionReason[];
  evidence: Record<string, string | number | boolean | null>;
  first_seen_at: string;
  last_seen_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
  suppressed_reason: string | null;
  recovery: { recovered_at: string; value: number | null } | null;
  last_delivered_at?: string | null;
  revision: number;
};

export type AlertDeliveryAttempt = {
  id: string;
  workspace_id: string;
  incident_id: string;
  destination_id: string;
  state: "in_flight" | "delivered" | "retryable_failure" | "permanent_failure" | "timeout" | "redacted_failure";
  attempt_number: number;
  http_status: number | null;
  error_code: string | null;
  started_at: string;
  finished_at: string | null;
};

export type AlertEvaluationKey = {
  alert_id: string;
  comparison_window_start: string;
  comparison_window_end: string;
  policy_version: string;
};
