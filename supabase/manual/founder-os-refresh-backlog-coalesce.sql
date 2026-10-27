-- Founder OS legacy refresh backlog coalescing.
-- Run only after the read-only preview and migration 20261028000001.
-- The function preserves one canonical job per workspace/window/kind and marks
-- only redundant queued/retryable fingerprint rows cancelled. It never deletes
-- telemetry, semantic facts, catalog data, or account data.

select * from public.trackmcp_coalesce_legacy_refresh_backlog(50000);

select
  count(*) filter (where state = 'queued') as queued_jobs,
  count(*) filter (where state = 'running') as running_jobs,
  count(*) filter (where state = 'retryable') as retryable_jobs,
  count(*) filter (where state = 'cancelled' and last_error_code = 'coalesced_legacy') as coalesced_legacy_jobs
from public.trackmcp_refresh_jobs;
