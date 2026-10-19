-- Read-only postflight for 20261018000004_action_queue_lifecycle.sql.
-- Run after the migration in the Supabase SQL Editor. This does not mutate data.

select
  to_regclass('public.trackmcp_action_queue') as action_queue_table,
  (
    select count(*)
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'trackmcp_action_queue'
      and column_name in (
        'acknowledged_at', 'acknowledged_by', 'snoozed_at',
        'snoozed_until', 'snoozed_by', 'resolved_by',
        'resolution_note', 'updated_at', 'revision'
      )
  ) as lifecycle_columns_present,
  (
    select count(*)
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'trackmcp_action_queue'
      and indexname = 'trackmcp_action_queue_snoozed_until_idx'
  ) as snoozed_index_present;

select
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.trackmcp_action_queue'::regclass
  and conname in (
    'trackmcp_action_queue_resolution_note_length',
    'trackmcp_action_queue_snooze_bounds',
    'trackmcp_action_queue_revision_positive'
  )
order by conname;

select
  count(*) filter (where status = 'snoozed' and snoozed_until is null) as invalid_snoozed_rows,
  count(*) filter (where revision <= 0) as invalid_revision_rows,
  count(*) filter (where resolution_note is not null and char_length(resolution_note) > 500) as oversized_notes,
  count(*) as total_action_queue_rows
from public.trackmcp_action_queue;
