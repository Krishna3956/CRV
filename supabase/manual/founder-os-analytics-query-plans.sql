-- Founder OS analytics query-plan evidence (READ ONLY)
-- Run in the authenticated Supabase SQL Editor with a real workspace UUID
-- substituted for :workspace_id in the four statements below. These are
-- planner-only EXPLAIN statements: they do not execute the reads and do not
-- change schema or data. Record the JSON output, database region, UTC time,
-- and the chosen workspace's approximate event volume in the release ledger.
-- Never paste API keys, tokens, payloads, or customer identifiers into this file.

-- 1) v1 bounded event scan (the application caps this at 10,000 rows).
explain (format json, analyze false, buffers false)
select event_id, workspace_id, event_type, service, environment, started_at,
       duration_ms, success, is_error, tool_name, client_name,
       account_identity_source
from public.trackmcp_events
where workspace_id = '00000000-0000-4000-8000-000000000000'::uuid
  and started_at >= now() - interval '7 days'
order by started_at asc
limit 10000;

-- 2) catalog history page plus one sentinel row.
explain (format json, analyze false, buffers false)
select id, workspace_id, server_id, environment_id, catalog_kind, item_count,
       snapshot_hash, complete, truncated, discovered_at
from public.trackmcp_catalog_versions
where workspace_id = '00000000-0000-4000-8000-000000000000'::uuid
  and discovered_at >= now() - interval '90 days'
order by discovered_at desc
limit 101;

-- 3) bounded hash-only catalog entity reads.
explain (format json, analyze false, buffers false)
select catalog_kind, entity_hash, success, is_error, result_type, observed_at
from public.trackmcp_catalog_entity_reads
where workspace_id = '00000000-0000-4000-8000-000000000000'::uuid
  and observed_at >= now() - interval '90 days'
order by observed_at asc
limit 10001;

-- 4) bounded refresh-job health read used by analytics status.
explain (format json, analyze false, buffers false)
select state, attempt_count, created_at, updated_at, completed_at,
       last_error_code
from public.trackmcp_refresh_jobs
where workspace_id = '00000000-0000-4000-8000-000000000000'::uuid
order by updated_at desc
limit 100;

-- Interpretation checklist (record separately, not as SQL output):
-- * The plan should use workspace/time indexes or an explicitly reviewed
--   alternative; a sequential scan is a review trigger, not a failure claim.
-- * Compare estimated rows and sort strategy with the application bounds.
-- * Capture p95/p99 latency separately with an approved load test; EXPLAIN
--   without ANALYZE intentionally does not execute customer reads.
-- * If repeated observations reach the workload thresholds, review the
--   rollup/cursor policy before increasing request limits.
