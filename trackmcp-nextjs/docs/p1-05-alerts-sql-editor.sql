-- P1-05 manual SQL Editor verification.
-- Apply the canonical migration file as one transaction before running this
-- read-only script. This script intentionally never rewrites event data.

begin;

select current_database() as database_name, version() as postgres_version;

select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'trackmcp_alert_configs',
    'trackmcp_alert_destinations',
    'trackmcp_alert_incidents',
    'trackmcp_alert_deliveries',
    'trackmcp_alert_evaluation_locks',
    'trackmcp_alert_evaluation_runs'
  )
order by table_name;

select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name in ('trackmcp_alert_configs', 'trackmcp_alert_destinations', 'trackmcp_alert_incidents', 'trackmcp_alert_deliveries')
order by table_name, ordinal_position;

select conrelid::regclass as table_name, conname, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid::regclass::text in (
  'public.trackmcp_alert_configs',
  'public.trackmcp_alert_destinations',
  'public.trackmcp_alert_incidents',
  'public.trackmcp_alert_deliveries'
)
order by table_name, conname;

select schemaname, tablename, indexname
from pg_indexes
where schemaname = 'public'
  and tablename like 'trackmcp_alert_%'
order by tablename, indexname;

select relname as table_name, relrowsecurity, relforcerowsecurity
from pg_class
where relnamespace = 'public'::regnamespace
  and relname like 'trackmcp_alert_%'
order by relname;

select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name like 'trackmcp_alert_%'
  and grantee in ('anon', 'authenticated')
order by grantee, table_name, privilege_type;

select count(*) as cross_workspace_destination_links
from public.trackmcp_alert_configs c
cross join lateral unnest(coalesce(c.destination_ids, '{}'::text[])) destination_id
join public.trackmcp_alert_destinations d on d.id::text = destination_id
where c.workspace_id <> d.workspace_id;

select count(*) as revoked_destinations_selected_for_delivery
from public.trackmcp_alert_deliveries delivery
join public.trackmcp_alert_destinations destination on destination.id = delivery.destination_id
where destination.revoked_at is not null;

rollback;
