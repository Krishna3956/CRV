import type { RegressionFinding } from "../telemetry/regressions.ts";
import { stableAlertIdentity, evaluationKey } from "./policy.ts";
import type { AlertIncident, AlertState } from "./types.ts";

function nextState(existing: AlertIncident | null, finding: RegressionFinding): AlertState {
  if (finding.data_status !== "sufficient") return existing?.state === "firing" ? "firing" : finding.data_status === "partial" ? "insufficient_data" : "insufficient_data";
  if (finding.severity) return "firing";
  return existing?.state === "firing" ? "resolved" : "suppressed";
}

export function transitionIncident(workspaceId: string, alertId: string, finding: RegressionFinding, existing: AlertIncident | null, now = new Date()): Partial<AlertIncident> & { evaluation_key: string } {
  const evaluation_key = evaluationKey(alertId, finding.comparison.window.start, finding.comparison.window.end);
  const state = nextState(existing, finding);
  const resolved = state === "resolved" ? (existing?.resolved_at || now.toISOString()) : null;
  return {
    workspace_id: workspaceId,
    alert_id: alertId,
    identity: stableAlertIdentity(workspaceId, alertId, finding.metric, finding.scope.tool_name, finding.scope.environment),
    evaluation_key,
    metric: finding.metric,
    state,
    severity: finding.severity,
    scope: finding.scope,
    data_status: finding.data_status,
    baseline: finding.baseline,
    comparison: finding.comparison,
    threshold: finding.threshold,
    reasons: finding.reasons,
    evidence: finding.evidence,
    first_seen_at: existing?.first_seen_at || now.toISOString(),
    last_seen_at: now.toISOString(),
    acknowledged_at: existing?.acknowledged_at || null,
    resolved_at: resolved,
    suppressed_reason: state === "suppressed" ? "below firing threshold" : null,
    recovery: resolved ? { recovered_at: resolved, value: finding.comparison.value } : null,
    revision: (existing?.revision || 0) + 1,
  };
}
