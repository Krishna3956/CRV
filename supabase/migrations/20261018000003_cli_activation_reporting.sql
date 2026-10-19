-- Server-side activation reporting and operator cleanup.
-- REVIEW ONLY: apply manually after 20261018000001 and 20261018000002.
-- This migration is idempotent. It stores no new raw identifiers or payloads.
-- Rollback before dependent code is deployed: drop the two functions below.
-- Do not drop the activation ledger or device-session tables as a rollback.

create or replace function public.trackmcp_activation_funnel_report(
  p_from timestamptz,
  p_to timestamptz
)
returns jsonb
language sql
security definer
set search_path = public
as $$
with session_counts as (
  select status, count(*)::bigint as status_count
  from public.trackmcp_cli_device_sessions
  where created_at >= p_from and created_at < p_to
  group by status
), event_counts as (
  select event_type || ':' || source as event_key, count(*)::bigint as event_count
  from public.trackmcp_activation_funnel_events
  where occurred_at >= p_from and occurred_at < p_to
  group by event_type, source
), ingest_counts as (
  select observation_source, count(*)::bigint as milestone_count
  from public.trackmcp_activation_milestones
  where first_accepted_at >= p_from and first_accepted_at < p_to
  group by observation_source
)
select jsonb_build_object(
  'device_sessions', jsonb_build_object(
    'started', (select coalesce(sum(status_count), 0) from session_counts),
    'by_status', coalesce((select jsonb_object_agg(status, status_count) from session_counts), '{}'::jsonb),
    'approved', coalesce((select status_count from session_counts where status = 'approved'), 0),
    'redeemed', coalesce((select status_count from session_counts where status = 'redeemed'), 0)
  ),
  'funnel_events', coalesce((select jsonb_object_agg(event_key, event_count) from event_counts), '{}'::jsonb),
  'first_accepted_ingest', jsonb_build_object(
    'count', (select coalesce(sum(milestone_count), 0) from ingest_counts),
    'by_observation_source', coalesce((select jsonb_object_agg(observation_source, milestone_count) from ingest_counts), '{}'::jsonb)
  )
);
$$;

revoke all on function public.trackmcp_activation_funnel_report(timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.trackmcp_activation_funnel_report(timestamptz, timestamptz) to service_role;

create or replace function public.trackmcp_cleanup_cli_device_sessions(
  p_before timestamptz default (now() - interval '24 hours')
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count bigint;
begin
  if p_before > now() - interval '24 hours' then
    raise exception 'cleanup boundary must be at least 24 hours old';
  end if;

  delete from public.trackmcp_cli_device_sessions
  where expires_at < p_before
     or (status in ('denied', 'redeemed', 'expired')
         and coalesce(redeemed_at, created_at) < p_before);

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function public.trackmcp_cleanup_cli_device_sessions(timestamptz) from public, anon, authenticated;
grant execute on function public.trackmcp_cleanup_cli_device_sessions(timestamptz) to service_role;
