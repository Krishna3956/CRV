import type { TrackMCPFact } from "./facts.ts";
import { actionQueueFingerprint, type TrackMCPActionQueueRule } from "./issue-identity.ts";

export type TrackMCPActionQueueCandidate = {
  workspace_id: string;
  fingerprint: string;
  rule_key: TrackMCPActionQueueRule;
  status: "open";
  severity: "warn";
  title: string;
  evidence: Record<string, string | number>;
};

type ActionQueueResult = { error: { code?: string; message: string } | null };
type ActionQueueClient = {
  from(table: "trackmcp_action_queue"): {
    upsert(rows: TrackMCPActionQueueCandidate[], options: { onConflict: string; ignoreDuplicates: boolean }): PromiseLike<ActionQueueResult>;
  };
};

/**
 * Conservative, explainable rules for the first action queue. Candidates are
 * suggestions, not diagnoses: each rule has a minimum sample size and carries
 * its evidence into the queue row for human review.
 */
export function evaluateTrackMCPActionQueue(workspaceId: string, facts: readonly TrackMCPFact[]): TrackMCPActionQueueCandidate[] {
  const result: TrackMCPActionQueueCandidate[] = [];
  const tools = new Map<string, { calls: number; failures: number }>();
  for (const fact of facts) {
    if (fact.fact_type !== "activity" || !fact.dimensions.tool_name) continue;
    const item = tools.get(fact.dimensions.tool_name) || { calls: 0, failures: 0 };
    item.calls += 1;
    if (fact.semantic.outcome === "failed") item.failures += 1;
    tools.set(fact.dimensions.tool_name, item);
  }
  for (const [tool, item] of tools) {
    const errorRate = item.failures / item.calls;
    if (item.calls < 5 || errorRate < 0.1) continue;
    const ruleKey = "high_tool_error_rate" as const;
    result.push({
      workspace_id: workspaceId,
      fingerprint: actionQueueFingerprint(workspaceId, ruleKey, tool),
      rule_key: ruleKey,
      status: "open",
      severity: "warn",
      title: `${tool} has an elevated error rate`,
      evidence: { tool_name: tool, calls: item.calls, failures: item.failures, error_rate: Number(errorRate.toFixed(4)) },
    });
  }

  const workflowFacts = facts.filter((fact) => fact.event_type === "workflow");
  const unresolved = workflowFacts.filter((fact) => ["pending", "unknown", "not_observable"].includes(fact.semantic.outcome)).length;
  if (workflowFacts.length >= 5 && unresolved / workflowFacts.length >= 0.5) {
    const ruleKey = "workflow_outcomes_unresolved" as const;
    result.push({
      workspace_id: workspaceId,
      fingerprint: actionQueueFingerprint(workspaceId, ruleKey),
      rule_key: ruleKey,
      status: "open",
      severity: "warn",
      title: "Many tracked workflows have no definitive outcome",
      evidence: { workflows: workflowFacts.length, unresolved, unresolved_rate: Number((unresolved / workflowFacts.length).toFixed(4)) },
    });
  }
  return result;
}

/** Create new queue signals without overwriting an operator's acknowledged or
 * resolved status. Repeated evaluations refresh only through a future explicit
 * queue lifecycle writer. */
export async function persistTrackMCPActionQueue(client: ActionQueueClient, candidates: readonly TrackMCPActionQueueCandidate[]) {
  if (!candidates.length) return { attempted: 0, error: null };
  const result = await client.from("trackmcp_action_queue").upsert([...candidates], {
    onConflict: "workspace_id,fingerprint",
    ignoreDuplicates: true,
  });
  return { attempted: candidates.length, error: result.error };
}

