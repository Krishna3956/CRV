-- Read-only postflight for 20261018000009_mcp_round_trip_outcomes.sql.
-- Run in the authenticated Supabase SQL editor; this does not mutate data.
select
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'trackmcp_events'
      and column_name = 'result_type'
  ) as has_result_type,
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'trackmcp_events'
      and column_name = 'interaction_id'
  ) as has_interaction_id,
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'trackmcp_events'
      and column_name = 'request_state_hash'
  ) as has_request_state_hash,
  exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and tablename = 'trackmcp_events'
      and indexname = 'trackmcp_events_workspace_interaction_idx'
  ) as has_interaction_index;

select conname
from pg_constraint
where conrelid = 'public.trackmcp_events'::regclass
  and conname in (
    'trackmcp_events_result_type_check',
    'trackmcp_events_interaction_id_check',
    'trackmcp_events_request_state_hash_check',
    'trackmcp_events_input_response_count_check',
    'trackmcp_events_resource_audience_check',
    'trackmcp_events_resource_priority_check'
  )
order by conname;
