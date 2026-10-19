-- Read-only activation report. Run with a service-role connection after both
-- CLI activation migrations are reviewed and applied. NPM downloads are external
-- aggregate data and intentionally are not joined to product facts.
with funnel as (
  select event_type, source, count(*)::bigint as event_count
  from public.trackmcp_activation_funnel_events
  where occurred_at >= :from_ts and occurred_at < :to_ts
  group by event_type, source
), sessions as (
  select status, count(*)::bigint as session_count
  from public.trackmcp_cli_device_sessions
  where created_at >= :from_ts and created_at < :to_ts
  group by status
), ingest as (
  select observation_source, count(*)::bigint as milestone_count
  from public.trackmcp_activation_milestones
  where first_accepted_at >= :from_ts and first_accepted_at < :to_ts
  group by observation_source
)
select jsonb_build_object(
  'range', jsonb_build_object('from', :from_ts, 'to', :to_ts),
  'funnel_events', coalesce((select jsonb_agg(to_jsonb(funnel) order by event_type, source) from funnel), '[]'::jsonb),
  'device_sessions', coalesce((select jsonb_agg(to_jsonb(sessions) order by status) from sessions), '[]'::jsonb),
  'first_accepted_ingest', coalesce((select jsonb_agg(to_jsonb(ingest) order by observation_source) from ingest), '[]'::jsonb),
  'npm_downloads', jsonb_build_object('value', null, 'label', 'aggregate downloads; not unique users')
) as activation_report;
