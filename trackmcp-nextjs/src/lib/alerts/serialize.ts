import type { AlertConfiguration, AlertDeliveryAttempt, AlertIncident } from "./types.ts";

export function serializeConfiguration(row: Record<string, unknown>): AlertConfiguration {
  return {
    id: String(row.id),
    workspace_id: String(row.workspace_id),
    metric: row.metric as AlertConfiguration["metric"],
    tool_name: typeof row.tool_name === "string" ? row.tool_name : null,
    environment: typeof row.environment === "string" ? row.environment : null,
    destination_ids: Array.isArray(row.destination_ids) ? row.destination_ids.filter((value): value is string => typeof value === "string").slice(0, 10) : [],
    policy_version: typeof row.policy_version === "string" ? row.policy_version : "p1-05-v1",
    enabled: row.enabled !== false,
    paused: row.paused === true,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export function serializeIncident(row: Record<string, unknown>): AlertIncident {
  return {
    id: String(row.id), workspace_id: String(row.workspace_id), alert_id: String(row.alert_id), identity: String(row.identity),
    metric: row.metric as AlertIncident["metric"], state: row.state as AlertIncident["state"], severity: (row.severity as AlertIncident["severity"]) || null,
    scope: { tool_name: typeof row.tool_name === "string" ? row.tool_name : null, environment: typeof row.environment === "string" ? row.environment : null },
    data_status: row.data_status as AlertIncident["data_status"], baseline: (row.baseline as AlertIncident["baseline"]) || null, comparison: (row.comparison as AlertIncident["comparison"]) || null,
    threshold: (row.threshold as Record<string, number>) || {}, reasons: Array.isArray(row.reasons) ? row.reasons.slice(0, 8) as AlertIncident["reasons"] : [], evidence: (row.evidence as AlertIncident["evidence"]) || {},
    first_seen_at: String(row.first_seen_at), last_seen_at: String(row.last_seen_at), acknowledged_at: typeof row.acknowledged_at === "string" ? row.acknowledged_at : null, resolved_at: typeof row.resolved_at === "string" ? row.resolved_at : null,
    suppressed_reason: typeof row.suppressed_reason === "string" ? row.suppressed_reason : null, recovery: (row.recovery as AlertIncident["recovery"]) || null, revision: Number(row.revision || 1),
  };
}

export function serializeDelivery(row: Record<string, unknown>): AlertDeliveryAttempt {
  return {
    id: String(row.id), workspace_id: String(row.workspace_id), incident_id: String(row.incident_id), destination_id: String(row.destination_id),
    state: row.state as AlertDeliveryAttempt["state"], attempt_number: Number(row.attempt_number || 0), http_status: typeof row.http_status === "number" ? row.http_status : null,
    error_code: typeof row.error_code === "string" ? row.error_code : null, started_at: String(row.started_at), finished_at: typeof row.finished_at === "string" ? row.finished_at : null,
  };
}
