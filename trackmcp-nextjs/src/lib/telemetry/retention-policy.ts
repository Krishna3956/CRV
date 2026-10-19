/**
 * Founder OS retention contract.
 *
 * These are defaults, not a substitute for a workspace's contractual policy.
 * The cleanup job must use the same values and emit a dry-run report before it
 * deletes anything. Retention is based on the event's observed/created time,
 * never on received_at alone.
 */

export type RetentionDataset = "raw_events" | "semantic_facts" | "action_queue" | "diagnostics";

export type RetentionRule = {
  dataset: RetentionDataset;
  table: string;
  days: number;
  timestampColumn: string;
  optional: boolean;
  rationale: string;
};

export const FOUNDER_OS_RETENTION_POLICY_VERSION = "v1" as const;

export const FOUNDER_OS_RETENTION_POLICY: readonly RetentionRule[] = [
  {
    dataset: "raw_events",
    table: "trackmcp_events",
    days: 90,
    timestampColumn: "started_at",
    optional: false,
    rationale: "Enough history for product decisions while limiting payload exposure and storage growth.",
  },
  {
    dataset: "semantic_facts",
    table: "trackmcp_semantic_facts",
    days: 365,
    timestampColumn: "observed_at",
    optional: false,
    rationale: "Derived, bounded facts support year-over-year product analysis without copying raw payloads.",
  },
  {
    dataset: "action_queue",
    table: "trackmcp_action_queue",
    days: 180,
    timestampColumn: "last_seen_at",
    optional: false,
    rationale: "Keeps unresolved investigation history while preventing stale signals from becoming permanent.",
  },
  {
    dataset: "diagnostics",
    table: "trackmcp_diagnostics",
    days: 30,
    timestampColumn: "created_at",
    optional: true,
    rationale: "Diagnostics are opt-in and potentially more sensitive; retain only briefly for troubleshooting.",
  },
] as const;

export function getRetentionRule(dataset: RetentionDataset): RetentionRule {
  const rule = FOUNDER_OS_RETENTION_POLICY.find((candidate) => candidate.dataset === dataset);
  if (!rule) throw new Error(`Unknown retention dataset: ${dataset}`);
  return rule;
}

export function retentionCutoff(now: Date, dataset: RetentionDataset): Date {
  const rule = getRetentionRule(dataset);
  const cutoff = new Date(now.getTime());
  cutoff.setUTCDate(cutoff.getUTCDate() - rule.days);
  return cutoff;
}

