-- Read-only postflight for the refresh-job schema and
-- 20261028000001_coalesce_refresh_jobs.sql.

select
  to_regclass('public.trackmcp_refresh_jobs') as refresh_jobs_table,
  (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'trackmcp_refresh_jobs') as column_count,
  (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'trackmcp_refresh_jobs' and column_name in ('request_revision', 'lease_revision')) as coalescing_column_count,
  (select count(*) from pg_indexes where schemaname = 'public' and tablename = 'trackmcp_refresh_jobs' and indexname in ('trackmcp_refresh_jobs_dedupe_idx', 'trackmcp_refresh_jobs_due_idx', 'trackmcp_refresh_jobs_lease_idx')) as expected_index_count;

select
  count(*) as total_jobs,
  count(*) filter (where state in ('queued', 'retryable') and available_at <= now()) as due_jobs,
  count(*) filter (where state = 'running' and lease_until < now()) as expired_leases,
  count(*) filter (where state = 'failed') as failed_jobs
from public.trackmcp_refresh_jobs;

-- Coalescing health: a high fingerprint-to-window ratio is a capacity smell,
-- not a reason to delete telemetry. This remains aggregate-only and read-only.
with queued as (
  select workspace_id, kind, dedupe_key,
    regexp_replace(dedupe_key, '^ingest-window:([0-9]+)(?::[a-f0-9]{64})?:.*$', '\\1') as window_id
  from public.trackmcp_refresh_jobs
  where state in ('queued', 'retryable', 'running')
), summary as (
  select count(*)::bigint as queued_jobs,
    count(distinct (workspace_id, kind, window_id))::bigint as distinct_windows,
    count(*) filter (where dedupe_key ~ '^ingest-window:[0-9]+:[a-f0-9]{64}:')::bigint as fingerprinted_jobs
  from queued
)
select *,
  case when distinct_windows = 0 then 0
       else round(fingerprinted_jobs::numeric / distinct_windows::numeric, 2)
  end as fingerprinted_jobs_per_window
from summary;
