import { evaluateRegressions, type RegressionEvent } from "../telemetry/regressions.ts";
import { persistEvaluation } from "./persistence.ts";
import type { AlertConfiguration, AlertIncident } from "./types.ts";

const MAX_SOURCE_EVENTS = 10_000;
const EVALUATION_LOOKBACK_DAYS = 8;

type EvaluationQuery = {
  select: (columns: string) => EvaluationQuery;
  eq: (field: string, value: unknown) => EvaluationQuery;
  gte: (field: string, value: string) => EvaluationQuery;
  order: (field: string, options: { ascending: boolean }) => EvaluationQuery;
  limit: (value: number) => Promise<{ data: unknown[] | null; error: unknown }>;
};

type EvaluationAdmin = { from: (table: string) => EvaluationQuery };

const EVENT_COLUMNS = "event_id, event_type, environment, deployment_id, observation_source, session_id, correlation_handle, workflow_id, tool_name, started_at, duration_ms, success, is_error, error_class, error_code, retry_number, payload_policy, payload";

export async function evaluateAlertConfiguration(admin: EvaluationAdmin, configuration: AlertConfiguration, now = new Date()): Promise<{ incidents: AlertIncident[]; error: unknown }> {
  const since = new Date(now.getTime() - EVALUATION_LOOKBACK_DAYS * 86400000).toISOString();
  const result = await admin.from("trackmcp_events").select(EVENT_COLUMNS).eq("workspace_id", configuration.workspace_id).gte("started_at", since).order("started_at", { ascending: true }).limit(MAX_SOURCE_EVENTS + 1);
  if (result.error) return { incidents: [], error: result.error };
  const rows = result.data || [];
  const finding = evaluateRegressions(rows as RegressionEvent[], { now, metric: configuration.metric, toolName: configuration.tool_name, environment: configuration.environment, truncated: rows.length > MAX_SOURCE_EVENTS });
  const incidents: AlertIncident[] = [];
  for (const item of finding) {
    const persisted = await persistEvaluation(admin as unknown as Parameters<typeof persistEvaluation>[0], configuration.workspace_id, configuration.id, item);
    if (persisted.error) return { incidents, error: persisted.error };
    if (persisted.data) incidents.push(persisted.data);
  }
  return { incidents, error: null };
}
