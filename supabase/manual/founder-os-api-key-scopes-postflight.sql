-- Read-only production postflight for connection-key scope enforcement.
select
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'trackmcp_api_keys' and column_name = 'service_scope'
  ) as service_scope_column_exists,
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'trackmcp_api_keys' and column_name = 'environment_scope'
  ) as environment_scope_column_exists,
  exists (
    select 1 from pg_indexes
    where schemaname = 'public' and tablename = 'trackmcp_api_keys' and indexname = 'trackmcp_api_keys_workspace_scope_idx'
  ) as scope_index_exists;

select
  count(*) as active_keys,
  count(*) filter (where service_scope is not null) as service_scoped_keys,
  count(*) filter (where environment_scope is not null) as environment_scoped_keys,
  count(*) filter (where service_scope is null and environment_scope is null) as workspace_wide_keys,
  count(*) filter (where service_scope is not null and char_length(service_scope) not between 1 and 100) as invalid_service_scopes,
  count(*) filter (where environment_scope is not null and char_length(environment_scope) not between 1 and 64) as invalid_environment_scopes
from public.trackmcp_api_keys
where revoked_at is null;

select
  count(*) filter (where service_scope is not null and environment_scope is not null) as fully_scoped_keys,
  count(*) filter (where service_scope is not null and environment_scope is null) as service_only_keys,
  count(*) filter (where service_scope is null and environment_scope is not null) as environment_only_keys
from public.trackmcp_api_keys
where revoked_at is null;
