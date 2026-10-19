-- Read-only postflight for 20261019000005_task_transition_history.sql.
-- Expected: table/columns/indexes present, RLS true, anon/authenticated denied.

select
  to_regclass('public.trackmcp_task_transitions') is not null as table_exists,
  coalesce((select relrowsecurity from pg_class where oid = 'public.trackmcp_task_transitions'::regclass), false) as rls_enabled;

select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'trackmcp_task_transitions'
order by ordinal_position;

select indexname
from pg_indexes
where schemaname = 'public' and tablename = 'trackmcp_task_transitions'
order by indexname;

select
  has_table_privilege('anon', 'public.trackmcp_task_transitions', 'select') as anon_can_select,
  has_table_privilege('authenticated', 'public.trackmcp_task_transitions', 'select') as authenticated_can_select,
  has_table_privilege('service_role', 'public.trackmcp_task_transitions', 'select') as service_role_can_select,
  has_table_privilege('service_role', 'public.trackmcp_task_transitions', 'insert') as service_role_can_insert;
