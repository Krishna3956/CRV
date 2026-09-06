-- P1-05: bounded regression alert state and delivery metadata.
-- Forward-only and transactional. No event rows are rewritten.
begin;

create table if not exists public.trackmcp_alert_destinations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.trackmcp_workspaces(id) on delete cascade,
  kind text not null,
  endpoint_url text,
  secret_ref text not null,
  enabled boolean not null default true,
  revoked_at timestamptz,
  rotated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trackmcp_alert_destinations_kind_check check (kind in ('webhook', 'email')),
  constraint trackmcp_alert_destinations_endpoint_check check ((kind = 'webhook' and endpoint_url is not null) or (kind = 'email')),
  constraint trackmcp_alert_destinations_secret_ref_check check (length(secret_ref) between 1 and 512)
);

create table if not exists public.trackmcp_alert_configs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.trackmcp_workspaces(id) on delete cascade,
  metric text not null,
  tool_name text,
  environment text,
  destination_ids text[] not null default '{}',
  policy_version text not null default 'p1-05-v1',
  enabled boolean not null default true,
  paused boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trackmcp_alert_configs_metric_check check (metric in ('tool_error_rate_spike', 'p95_latency_regression', 'empty_result_spike', 'retry_loop_spike', 'catalog_description_drift', 'workflow_completion_drop', 'authorization_failure_spike', 'deployment_comparison')),
  constraint trackmcp_alert_configs_tool_name_check check (tool_name is null or length(tool_name) between 1 and 2048),
  constraint trackmcp_alert_configs_environment_check check (environment is null or length(environment) between 1 and 128),
  constraint trackmcp_alert_configs_policy_check check (policy_version = 'p1-05-v1'),
  constraint trackmcp_alert_configs_destinations_check check (cardinality(destination_ids) between 0 and 10)
);

create table if not exists public.trackmcp_alert_incidents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.trackmcp_workspaces(id) on delete cascade,
  alert_id uuid not null references public.trackmcp_alert_configs(id) on delete cascade,
  identity text not null,
  evaluation_key text not null,
  metric text not null,
  state text not null,
  severity text,
  tool_name text,
  environment text,
  data_status text not null,
  baseline jsonb,
  comparison jsonb,
  threshold jsonb not null default '{}'::jsonb,
  reasons jsonb not null default '[]'::jsonb,
  evidence jsonb not null default '{}'::jsonb,
  first_seen_at timestamptz not null,
  last_seen_at timestamptz not null,
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  suppressed_reason text,
  recovery jsonb,
  revision integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trackmcp_alert_incidents_metric_check check (metric in ('tool_error_rate_spike', 'p95_latency_regression', 'empty_result_spike', 'retry_loop_spike', 'catalog_description_drift', 'workflow_completion_drop', 'authorization_failure_spike', 'deployment_comparison')),
  constraint trackmcp_alert_incidents_state_check check (state in ('pending', 'firing', 'resolved', 'suppressed', 'insufficient_data', 'invalid_configuration')),
  constraint trackmcp_alert_incidents_severity_check check (severity is null or severity in ('warning', 'critical')),
  constraint trackmcp_alert_incidents_data_status_check check (data_status in ('sufficient', 'insufficient_data', 'partial')),
  constraint trackmcp_alert_incidents_revision_check check (revision >= 1)
);

create table if not exists public.trackmcp_alert_deliveries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.trackmcp_workspaces(id) on delete cascade,
  incident_id uuid not null references public.trackmcp_alert_incidents(id) on delete cascade,
  destination_id uuid not null references public.trackmcp_alert_destinations(id) on delete restrict,
  idempotency_key text not null,
  state text not null,
  attempt_number integer not null default 1,
  http_status integer,
  error_code text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  next_attempt_at timestamptz,
  constraint trackmcp_alert_deliveries_state_check check (state in ('delivered', 'retryable_failure', 'permanent_failure', 'timeout', 'redacted_failure')),
  constraint trackmcp_alert_deliveries_attempt_check check (attempt_number between 1 and 4),
  constraint trackmcp_alert_deliveries_http_status_check check (http_status is null or http_status between 100 and 599)
);

create unique index if not exists trackmcp_alert_configs_workspace_id_idx
  on public.trackmcp_alert_configs (workspace_id, id);
create index if not exists trackmcp_alert_configs_workspace_enabled_idx
  on public.trackmcp_alert_configs (workspace_id, enabled, paused);
create unique index if not exists trackmcp_alert_incidents_workspace_evaluation_idx
  on public.trackmcp_alert_incidents (workspace_id, evaluation_key);
create index if not exists trackmcp_alert_incidents_workspace_state_seen_idx
  on public.trackmcp_alert_incidents (workspace_id, state, last_seen_at desc);
create index if not exists trackmcp_alert_deliveries_retry_idx
  on public.trackmcp_alert_deliveries (state, next_attempt_at)
  where state = 'retryable_failure';
create unique index if not exists trackmcp_alert_deliveries_idempotency_idx
  on public.trackmcp_alert_deliveries (workspace_id, idempotency_key);
create index if not exists trackmcp_alert_destinations_workspace_enabled_idx
  on public.trackmcp_alert_destinations (workspace_id, enabled, revoked_at);

-- A same-named incompatible constraint must not make an idempotent replay appear
-- successful. Missing constraints are added; existing definitions are checked
-- semantically before the transaction can commit.
do $$
declare
  definition text;
begin
  select pg_get_constraintdef(oid) into definition from pg_constraint
   where conrelid = 'public.trackmcp_alert_destinations'::regclass
     and conname = 'trackmcp_alert_destinations_kind_check';
  if definition is null then
    alter table public.trackmcp_alert_destinations add constraint trackmcp_alert_destinations_kind_check check (kind in ('webhook', 'email'));
  elsif lower(regexp_replace(definition, '\s+', '', 'g')) not like '%webhook%' or lower(regexp_replace(definition, '\s+', '', 'g')) not like '%email%' then
    raise exception 'trackmcp_alert_destinations_kind_check exists with incompatible definition: %', definition;
  end if;

  select pg_get_constraintdef(oid) into definition from pg_constraint
   where conrelid = 'public.trackmcp_alert_configs'::regclass
     and conname = 'trackmcp_alert_configs_metric_check';
  if definition is null then
    alter table public.trackmcp_alert_configs add constraint trackmcp_alert_configs_metric_check check (metric in ('tool_error_rate_spike', 'p95_latency_regression', 'empty_result_spike', 'retry_loop_spike', 'catalog_description_drift', 'workflow_completion_drop', 'authorization_failure_spike', 'deployment_comparison'));
  elsif lower(regexp_replace(definition, '\s+', '', 'g')) not like '%tool_error_rate_spike%' or lower(regexp_replace(definition, '\s+', '', 'g')) not like '%deployment_comparison%' then
    raise exception 'trackmcp_alert_configs_metric_check exists with incompatible definition: %', definition;
  end if;

  select pg_get_constraintdef(oid) into definition from pg_constraint
   where conrelid = 'public.trackmcp_alert_incidents'::regclass
     and conname = 'trackmcp_alert_incidents_state_check';
  if definition is null then
    alter table public.trackmcp_alert_incidents add constraint trackmcp_alert_incidents_state_check check (state in ('pending', 'firing', 'resolved', 'suppressed', 'insufficient_data', 'invalid_configuration'));
  elsif lower(regexp_replace(definition, '\s+', '', 'g')) not like '%firing%' or lower(regexp_replace(definition, '\s+', '', 'g')) not like '%invalid_configuration%' then
    raise exception 'trackmcp_alert_incidents_state_check exists with incompatible definition: %', definition;
  end if;

  select pg_get_constraintdef(oid) into definition from pg_constraint
   where conrelid = 'public.trackmcp_alert_deliveries'::regclass
     and conname = 'trackmcp_alert_deliveries_attempt_check';
  if definition is null then
    alter table public.trackmcp_alert_deliveries add constraint trackmcp_alert_deliveries_attempt_check check (attempt_number between 1 and 4);
  elsif lower(regexp_replace(definition, '\s+', '', 'g')) not like '%between1and4%' then
    raise exception 'trackmcp_alert_deliveries_attempt_check exists with incompatible definition: %', definition;
  end if;
end
$$;

alter table public.trackmcp_alert_destinations enable row level security;
alter table public.trackmcp_alert_configs enable row level security;
alter table public.trackmcp_alert_incidents enable row level security;
alter table public.trackmcp_alert_deliveries enable row level security;

revoke all on public.trackmcp_alert_destinations from anon, authenticated;
revoke all on public.trackmcp_alert_configs from anon, authenticated;
revoke all on public.trackmcp_alert_incidents from anon, authenticated;
revoke all on public.trackmcp_alert_deliveries from anon, authenticated;

-- The application uses the service-role client after resolving workspace membership.
-- No public policy is added, so an API client cannot bypass that application boundary.

commit;
