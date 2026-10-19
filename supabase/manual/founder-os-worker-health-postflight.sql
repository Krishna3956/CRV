-- Founder OS worker-health postflight (READ ONLY).
--
-- Run this after the refresh-job and worker-RPC migrations have been applied.
-- It intentionally returns aggregate counts and bounded timestamps only; it
-- never selects event payloads, API keys, lease owners, or error details.

-- Result 1: refresh queue health and lag.
select
  count(*)::bigint as total_refresh_jobs,
  count(*) filter (where state = 'queued')::bigint as queued_jobs,
  count(*) filter (where state = 'queued' and available_at <= now())::bigint as due_jobs,
  count(*) filter (where state = 'running')::bigint as running_jobs,
  count(*) filter (where state = 'running' and lease_until < now())::bigint as expired_leases,
  count(*) filter (where state = 'retryable')::bigint as retryable_jobs,
  count(*) filter (where state = 'failed')::bigint as failed_jobs,
  count(*) filter (where state = 'succeeded')::bigint as succeeded_jobs,
  coalesce(
    max(extract(epoch from (now() - created_at)) * 1000)
      filter (where state in ('queued', 'retryable') and available_at <= now()),
    0
  )::bigint as max_due_age_ms,
  coalesce(
    max(extract(epoch from (now() - updated_at)) * 1000)
      filter (where state = 'running'),
    0
  )::bigint as max_running_age_ms
from public.trackmcp_refresh_jobs;

-- Result 2: refresh jobs by kind, without exposing workspace or error data.
select kind, state, count(*)::bigint as job_count
from public.trackmcp_refresh_jobs
group by kind, state
order by kind, state;

-- Result 3: action-queue lifecycle health.
select
  count(*)::bigint as total_action_items,
  count(*) filter (where status = 'open')::bigint as open_items,
  count(*) filter (where status = 'acknowledged')::bigint as acknowledged_items,
  count(*) filter (where status = 'snoozed')::bigint as snoozed_items,
  count(*) filter (where status = 'resolved')::bigint as resolved_items,
  coalesce(max(extract(epoch from (now() - last_seen_at)) * 1000), 0)::bigint as oldest_item_age_ms
from public.trackmcp_action_queue;

