-- Read-only postflight checks for the account identity contract and
-- 20261029000002_account_identity_version.sql.
-- Run after the migration in the authenticated Supabase SQL editor.

select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'trackmcp_events'
  and column_name in ('account_key', 'account_identity_source', 'account_identity_version')
order by column_name;

select conname, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.trackmcp_events'::regclass
  and conname in (
    'trackmcp_events_account_identity_source_check',
    'trackmcp_events_account_key_shape_check',
    'trackmcp_events_account_identity_version_check'
  )
order by conname;

select indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'trackmcp_events'
  and indexname in ('trackmcp_events_workspace_account_started_idx', 'trackmcp_events_workspace_account_identity_started_idx');

select
  count(*) filter (where account_identity_source = 'resolver' and account_key is not null) as resolver_rows,
  count(*) filter (where account_identity_source = 'resolver' and account_key is not null and account_identity_version = 'sha256-v1') as versioned_resolver_rows,
  count(*) filter (where account_identity_source = 'unresolved' and account_key is null) as unresolved_rows,
  count(*) filter (where account_identity_source is null and account_key is null) as legacy_rows,
  count(*) filter (where account_key is not null and account_identity_source <> 'resolver') as invalid_identity_pairs,
  count(*) filter (where (account_key is null and account_identity_version is not null) or (account_key is not null and account_identity_version <> 'sha256-v1')) as invalid_identity_versions
from public.trackmcp_events;
