# Founder OS retention and deletion policy

Policy version: `v1`

This is the local contract for cleanup jobs and operator review. It does not
execute cleanup and does not override a workspace-specific contractual policy.

| Dataset | Default retention | Timestamp | Notes |
| --- | ---: | --- | --- |
| Raw telemetry events | 90 days | `started_at` | May contain bounded payload data; never export it as part of a dry run. |
| Semantic facts | 365 days | `observed_at` | Derived, bounded facts; no raw payload copy. |
| Action queue | 180 days | `last_seen_at` | Old resolved or stale signals should not remain open forever. |
| Optional diagnostics | 30 days | `created_at` | Disabled unless explicitly enabled; potentially more sensitive. |

The cleanup operator must:

1. Run the read-only dry-run in `supabase/manual/founder-os-retention.sql`.
2. Review row counts and oldest timestamps per workspace where applicable.
3. Record policy version, operator, UTC timestamp, and the dry-run output.
4. Delete in small batches inside a transaction, or use a bounded scheduled job.
5. Re-run the dry-run and retain the postflight result.

Deletion is not backfill, anonymization, or a claim that the remaining data is
anonymous. A workspace deletion/export request takes precedence over these
defaults. Never delete device-code hashes or raw API keys by copying them into a
report; the CLI device-session cleanup remains governed by its separate policy.

The SQL file intentionally leaves destructive statements commented out. It is a
review artifact for the authenticated Supabase SQL Editor, not an automatic
migration.

