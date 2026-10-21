-- Optional server/environment scopes for connection keys.
-- Existing keys remain workspace-scoped when both values are NULL.

alter table public.trackmcp_api_keys
  add column if not exists service_scope text,
  add column if not exists environment_scope text;

alter table public.trackmcp_api_keys
  drop constraint if exists trackmcp_api_keys_service_scope_check,
  drop constraint if exists trackmcp_api_keys_environment_scope_check;

alter table public.trackmcp_api_keys
  add constraint trackmcp_api_keys_service_scope_check
    check (service_scope is null or char_length(service_scope) between 1 and 100),
  add constraint trackmcp_api_keys_environment_scope_check
    check (environment_scope is null or char_length(environment_scope) between 1 and 64);

create index if not exists trackmcp_api_keys_workspace_scope_idx
  on public.trackmcp_api_keys (workspace_id, service_scope, environment_scope)
  where revoked_at is null;

comment on column public.trackmcp_api_keys.service_scope is
  'Optional bounded service label enforced at ingest; NULL preserves workspace-wide compatibility.';
comment on column public.trackmcp_api_keys.environment_scope is
  'Optional bounded environment label enforced at ingest; NULL preserves workspace-wide compatibility.';
