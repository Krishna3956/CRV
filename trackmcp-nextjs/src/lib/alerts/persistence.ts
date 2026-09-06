import { stableAlertIdentity, evaluationKey } from "./policy.ts";
import { transitionIncident } from "./lifecycle.ts";
import type { AlertIncident } from "./types.ts";
import type { RegressionFinding } from "../telemetry/regressions.ts";

function boundedEvidence(value: Record<string, unknown>): Record<string, unknown> {
  const encoded = JSON.stringify(value);
  return new TextEncoder().encode(encoded).byteLength <= 32 * 1024 ? value : { truncated: true };
}

export function incidentRow(workspaceId: string, alertId: string, finding: RegressionFinding): Record<string, unknown> {
  const start = finding.comparison.window.start;
  const end = finding.comparison.window.end;
  return {
    workspace_id: workspaceId,
    alert_id: alertId,
    identity: stableAlertIdentity(workspaceId, alertId, finding.metric, finding.scope.tool_name, finding.scope.environment),
    evaluation_key: evaluationKey(alertId, start, end),
    metric: finding.metric,
    state: finding.data_status === "sufficient" && finding.severity ? "firing" : finding.data_status,
    severity: finding.severity,
    tool_name: finding.scope.tool_name,
    environment: finding.scope.environment,
    data_status: finding.data_status,
    baseline: finding.baseline,
    comparison: finding.comparison,
    threshold: finding.threshold,
    reasons: finding.reasons.slice(0, 8),
    evidence: boundedEvidence(finding.evidence),
    first_seen_at: end,
    last_seen_at: end,
    revision: 1,
    updated_at: new Date().toISOString(),
  };
}

type PersistenceQuery = {
  select: (columns: string) => PersistenceQuery;
  eq: (field: string, value: unknown) => PersistenceQuery;
  order: (field: string, options: { ascending: boolean }) => PersistenceQuery;
  limit: (value: number) => PersistenceQuery;
  maybeSingle: () => Promise<{ data: unknown; error: unknown }>;
  single: () => Promise<{ data: unknown; error: unknown }>;
  upsert: (row: Record<string, unknown>, options: { onConflict: string; ignoreDuplicates: boolean }) => {
    select: (columns: string) => { single: () => Promise<{ data: unknown; error: unknown }> };
  };
};
type PersistenceAdmin = { from: (table: string) => PersistenceQuery };

export async function persistEvaluation(admin: PersistenceAdmin, workspaceId: string, alertId: string, finding: RegressionFinding): Promise<{ data: AlertIncident | null; error: unknown }> {
  const identity = stableAlertIdentity(workspaceId, alertId, finding.metric, finding.scope.tool_name, finding.scope.environment);
  const previousResult = await admin.from("trackmcp_alert_incidents").select("*").eq("workspace_id", workspaceId).eq("identity", identity).order("last_seen_at", { ascending: false }).limit(1).maybeSingle();
  if (previousResult.error) return { data: null, error: previousResult.error };
  const previous = previousResult.data as AlertIncident | null;
  const transitioned = transitionIncident(workspaceId, alertId, finding, previous);
  const result = await admin.from("trackmcp_alert_incidents").upsert({ ...incidentRow(workspaceId, alertId, finding), ...transitioned, tool_name: finding.scope.tool_name, environment: finding.scope.environment }, { onConflict: "workspace_id,evaluation_key", ignoreDuplicates: false }).select("*").single();
  return { data: result.data as AlertIncident | null, error: result.error };
}
