-- Read-only postflight checks for 20261018000003_founder_os_read_model.sql.
-- This does not insert, update, or delete data.

select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('trackmcp_semantic_facts', 'trackmcp_action_queue')
order by table_name;

select indexname, tablename, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename in ('trackmcp_semantic_facts', 'trackmcp_action_queue')
order by tablename, indexname;

select relname as table_name, relrowsecurity as row_level_security_enabled
from pg_class
where oid in ('public.trackmcp_semantic_facts'::regclass, 'public.trackmcp_action_queue'::regclass)
order by relname;

select count(*) as semantic_fact_rows
from public.trackmcp_semantic_facts;

select count(*) as action_queue_rows
from public.trackmcp_action_queue;
