import { hashTrackMCPKey } from "./keys.ts";

export type TrackMCPActionQueueRule = "high_tool_error_rate" | "workflow_outcomes_unresolved";

/** Map alert metrics to the conservative Action Queue rule they can support. */
export function actionQueueRuleForAlertMetric(metric: string): TrackMCPActionQueueRule | null {
  if (metric === "tool_error_rate_spike") return "high_tool_error_rate";
  if (metric === "workflow_completion_drop") return "workflow_outcomes_unresolved";
  return null;
}

/**
 * Stable, workspace-scoped identity shared by alert evidence and queue rows.
 * It contains no event payload, URL, credential, or customer-provided text.
 */
export function actionQueueFingerprint(workspaceId: string, rule: TrackMCPActionQueueRule, toolName: string | null = null): string {
  return hashTrackMCPKey(`${workspaceId}:${rule}:${toolName || "*"}`);
}

export function relatedActionQueueFingerprint(workspaceId: string, metric: string, toolName: string | null): string | null {
  const rule = actionQueueRuleForAlertMetric(metric);
  return rule ? actionQueueFingerprint(workspaceId, rule, toolName) : null;
}
