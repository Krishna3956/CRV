-- Read-only postflight for 20261018000006_founder_os_refresh_jobs.sql.

select
  to_regclass('public.trackmcp_refresh_jobs') as refresh_jobs_table,
  (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'trackmcp_refresh_jobs') as column_count,
  (select count(*) from pg_indexes where schemaname = 'public' and tablename = 'trackmcp_refresh_jobs' and indexname in ('trackmcp_refresh_jobs_dedupe_idx', 'trackmcp_refresh_jobs_due_idx', 'trackmcp_refresh_jobs_lease_idx')) as expected_index_count;

select
  count(*) as total_jobs,
  count(*) filter (where state in ('queued', 'retryable') and available_at <= now()) as due_jobs,
  count(*) filter (where state = 'running' and lease_until < now()) as expired_leases,
  count(*) filter (where state = 'failed') as failed_jobs
from public.trackmcp_refresh_jobs;
