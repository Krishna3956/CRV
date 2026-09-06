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
  last_delivered_at timestamptz,
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
  constraint trackmcp_alert_deliveries_state_check check (state in ('in_flight', 'delivered', 'retryable_failure', 'permanent_failure', 'timeout', 'redacted_failure')),
  constraint trackmcp_alert_deliveries_attempt_check check (attempt_number between 1 and 4),
  constraint trackmcp_alert_deliveries_http_status_check check (http_status is null or http_status between 100 and 599)
);

alter table public.trackmcp_alert_incidents add column if not exists last_delivered_at timestamptz;

create table if not exists public.trackmcp_alert_evaluation_locks (
  lock_key text primary key,
  owner_id text not null,
  locked_until timestamptz not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.trackmcp_alert_evaluation_runs (
  id uuid primary key default gen_random_uuid(),
  lock_key text not null,
  evaluation_key text not null,
  state text not null,
  config_count integer not null default 0,
  incident_count integer not null default 0,
  error_code text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  constraint trackmcp_alert_evaluation_runs_state_check check (state in ('started', 'succeeded', 'failed')),
  constraint trackmcp_alert_evaluation_runs_count_check check (config_count between 0 and 1000 and incident_count between 0 and 10000),
  constraint trackmcp_alert_evaluation_runs_key_check check (length(lock_key) between 1 and 2048 and length(evaluation_key) between 1 and 2048)
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
create unique index if not exists trackmcp_alert_incidents_identity_evaluation_idx
  on public.trackmcp_alert_incidents (workspace_id, identity, evaluation_key);
create index if not exists trackmcp_alert_destinations_workspace_enabled_idx
  on public.trackmcp_alert_destinations (workspace_id, enabled, revoked_at);
create index if not exists trackmcp_alert_evaluation_runs_started_idx
  on public.trackmcp_alert_evaluation_runs (started_at desc);
create unique index if not exists trackmcp_alert_evaluation_runs_key_idx
  on public.trackmcp_alert_evaluation_runs (lock_key, evaluation_key);

create or replace function public.trackmcp_claim_alert_evaluation(
  p_lock_key text,
  p_owner_id text,
  p_now timestamptz,
  p_lease_until timestamptz
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed boolean := false;
begin
  insert into public.trackmcp_alert_evaluation_locks (lock_key, owner_id, locked_until, updated_at)
  values (p_lock_key, p_owner_id, p_lease_until, p_now)
  on conflict (lock_key) do update
    set owner_id = excluded.owner_id, locked_until = excluded.locked_until, updated_at = excluded.updated_at
    where trackmcp_alert_evaluation_locks.locked_until <= p_now
  returning true into claimed;
  return coalesce(claimed, false);
end;
$$;

create or replace function public.trackmcp_release_alert_evaluation(p_lock_key text, p_owner_id text, p_now timestamptz)
returns boolean
language sql
security definer
set search_path = public
as $$
  with updated as (
    update public.trackmcp_alert_evaluation_locks
       set locked_until = p_now, updated_at = p_now
     where lock_key = p_lock_key and owner_id = p_owner_id
     returning 1
  ) select exists(select 1 from updated);
$$;

create or replace function public.trackmcp_validate_alert_ownership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_table_name = 'trackmcp_alert_destinations' and tg_op = 'UPDATE' and new.workspace_id is distinct from old.workspace_id then
    raise exception 'alert destination workspace ownership is immutable';
  end if;
  if tg_table_name = 'trackmcp_alert_configs' and exists (
    select 1 from unnest(coalesce(new.destination_ids, '{}'::text[])) as destination_id
    where not exists (
      select 1 from public.trackmcp_alert_destinations d
       where d.id::text = destination_id and d.workspace_id = new.workspace_id
    )
  ) then
    raise exception 'alert destinations must belong to the alert workspace';
  end if;
  if tg_table_name = 'trackmcp_alert_incidents' and not exists (
    select 1 from public.trackmcp_alert_configs c where c.id = new.alert_id and c.workspace_id = new.workspace_id
  ) then
    raise exception 'alert incident must belong to the alert workspace';
  end if;
  if tg_table_name = 'trackmcp_alert_deliveries' and (
    not exists (select 1 from public.trackmcp_alert_incidents i where i.id = new.incident_id and i.workspace_id = new.workspace_id)
    or not exists (select 1 from public.trackmcp_alert_destinations d where d.id = new.destination_id and d.workspace_id = new.workspace_id)
  ) then
    raise exception 'alert delivery records must remain workspace scoped';
  end if;
  return new;
end;
$$;

drop trigger if exists trackmcp_alert_configs_ownership_trigger on public.trackmcp_alert_configs;
create trigger trackmcp_alert_configs_ownership_trigger before insert or update on public.trackmcp_alert_configs
for each row execute function public.trackmcp_validate_alert_ownership();
drop trigger if exists trackmcp_alert_incidents_ownership_trigger on public.trackmcp_alert_incidents;
create trigger trackmcp_alert_incidents_ownership_trigger before insert or update on public.trackmcp_alert_incidents
for each row execute function public.trackmcp_validate_alert_ownership();
drop trigger if exists trackmcp_alert_deliveries_ownership_trigger on public.trackmcp_alert_deliveries;
create trigger trackmcp_alert_deliveries_ownership_trigger before insert or update on public.trackmcp_alert_deliveries
for each row execute function public.trackmcp_validate_alert_ownership();
drop trigger if exists trackmcp_alert_destinations_ownership_trigger on public.trackmcp_alert_destinations;
create trigger trackmcp_alert_destinations_ownership_trigger before update on public.trackmcp_alert_destinations
for each row execute function public.trackmcp_validate_alert_ownership();

do $$
begin
  if exists (
    select 1 from public.trackmcp_alert_configs c
    cross join lateral unnest(coalesce(c.destination_ids, '{}'::text[])) as destination_id
    join public.trackmcp_alert_destinations d on d.id::text = destination_id
    where c.workspace_id <> d.workspace_id
  ) then
    raise exception 'existing alert configuration contains a cross-workspace destination';
  end if;
  if exists (
    select 1 from public.trackmcp_alert_deliveries d
    join public.trackmcp_alert_incidents i on i.id = d.incident_id
    join public.trackmcp_alert_destinations destination on destination.id = d.destination_id
    where d.workspace_id <> i.workspace_id or d.workspace_id <> destination.workspace_id
  ) then
    raise exception 'existing alert delivery contains a cross-workspace reference';
  end if;
end
$$;

-- A same-named incompatible constraint or index must not make an idempotent
-- replay appear successful. Existing definitions are compared exactly after
-- PostgreSQL's canonical rendering; a mismatch aborts this transaction.
do $$
declare
  definition text;
  normalized text;
  expected record;
  actual_unique boolean;
  actual_columns text[];
  actual_predicate text;
begin
  select pg_get_constraintdef(oid) into definition from pg_constraint
   where conrelid = 'public.trackmcp_alert_destinations'::regclass
     and conname = 'trackmcp_alert_destinations_kind_check';
  if definition is null then
    alter table public.trackmcp_alert_destinations add constraint trackmcp_alert_destinations_kind_check check (kind in ('webhook', 'email'));
  else
    normalized := lower(regexp_replace(definition, '\s+', '', 'g'));
    if normalized not in ('check((kind=any(array[''webhook''::text,''email''::text])))', 'check(((kind=any(array[''webhook''::text,''email''::text]))))') then
    raise exception 'trackmcp_alert_destinations_kind_check exists with incompatible definition: %', definition;
    end if;
  end if;

  select pg_get_constraintdef(oid) into definition from pg_constraint
   where conrelid = 'public.trackmcp_alert_configs'::regclass
     and conname = 'trackmcp_alert_configs_metric_check';
  if definition is null then
    alter table public.trackmcp_alert_configs add constraint trackmcp_alert_configs_metric_check check (metric in ('tool_error_rate_spike', 'p95_latency_regression', 'empty_result_spike', 'retry_loop_spike', 'catalog_description_drift', 'workflow_completion_drop', 'authorization_failure_spike', 'deployment_comparison'));
  else
    normalized := lower(regexp_replace(definition, '\s+', '', 'g'));
    if normalized not in ('check((metric=any(array[''tool_error_rate_spike''::text,''p95_latency_regression''::text,''empty_result_spike''::text,''retry_loop_spike''::text,''catalog_description_drift''::text,''workflow_completion_drop''::text,''authorization_failure_spike''::text,''deployment_comparison''::text])))', 'check(((metric=any(array[''tool_error_rate_spike''::text,''p95_latency_regression''::text,''empty_result_spike''::text,''retry_loop_spike''::text,''catalog_description_drift''::text,''workflow_completion_drop''::text,''authorization_failure_spike''::text,''deployment_comparison''::text]))))') then
    raise exception 'trackmcp_alert_configs_metric_check exists with incompatible definition: %', definition;
    end if;
  end if;

  select pg_get_constraintdef(oid) into definition from pg_constraint
   where conrelid = 'public.trackmcp_alert_incidents'::regclass
     and conname = 'trackmcp_alert_incidents_state_check';
  if definition is null then
    alter table public.trackmcp_alert_incidents add constraint trackmcp_alert_incidents_state_check check (state in ('pending', 'firing', 'resolved', 'suppressed', 'insufficient_data', 'invalid_configuration'));
  else
    normalized := lower(regexp_replace(definition, '\s+', '', 'g'));
    if normalized not in ('check((state=any(array[''pending''::text,''firing''::text,''resolved''::text,''suppressed''::text,''insufficient_data''::text,''invalid_configuration''::text])))', 'check(((state=any(array[''pending''::text,''firing''::text,''resolved''::text,''suppressed''::text,''insufficient_data''::text,''invalid_configuration''::text]))))') then
    raise exception 'trackmcp_alert_incidents_state_check exists with incompatible definition: %', definition;
    end if;
  end if;

  select pg_get_constraintdef(oid) into definition from pg_constraint
   where conrelid = 'public.trackmcp_alert_deliveries'::regclass
     and conname = 'trackmcp_alert_deliveries_attempt_check';
  if definition is null then
    alter table public.trackmcp_alert_deliveries add constraint trackmcp_alert_deliveries_attempt_check check (attempt_number between 1 and 4);
  else
    normalized := lower(regexp_replace(definition, '\s+', '', 'g'));
    if normalized not in ('check((attempt_number>=1)and(attempt_number<=4))', 'check(((attempt_number>=1)and(attempt_number<=4)))') then
    raise exception 'trackmcp_alert_deliveries_attempt_check exists with incompatible definition: %', definition;
    end if;
  end if;

  select pg_get_constraintdef(oid) into definition from pg_constraint
   where conrelid = 'public.trackmcp_alert_deliveries'::regclass
     and conname = 'trackmcp_alert_deliveries_state_check';
  if definition is null then
    alter table public.trackmcp_alert_deliveries add constraint trackmcp_alert_deliveries_state_check check (state in ('in_flight', 'delivered', 'retryable_failure', 'permanent_failure', 'timeout', 'redacted_failure'));
  else
    normalized := lower(regexp_replace(definition, '\s+', '', 'g'));
    if normalized not in ('check((state=any(array[''in_flight''::text,''delivered''::text,''retryable_failure''::text,''permanent_failure''::text,''timeout''::text,''redacted_failure''::text])))', 'check(((state=any(array[''in_flight''::text,''delivered''::text,''retryable_failure''::text,''permanent_failure''::text,''timeout''::text,''redacted_failure''::text]))))') then
    raise exception 'trackmcp_alert_deliveries_state_check exists with incompatible definition: %', definition;
    end if;
  end if;

  for expected in select * from (values
    ('public', 'trackmcp_alert_configs_workspace_id_idx', true, array['workspace_id','id']::text[], null::text),
    ('public', 'trackmcp_alert_configs_workspace_enabled_idx', false, array['workspace_id','enabled','paused']::text[], null::text),
    ('public', 'trackmcp_alert_incidents_workspace_evaluation_idx', true, array['workspace_id','evaluation_key']::text[], null::text),
    ('public', 'trackmcp_alert_incidents_workspace_state_seen_idx', false, array['workspace_id','state','last_seen_at']::text[], null::text),
    ('public', 'trackmcp_alert_deliveries_retry_idx', false, array['state','next_attempt_at']::text[], '(state=''retryable_failure''::text)'),
    ('public', 'trackmcp_alert_deliveries_idempotency_idx', true, array['workspace_id','idempotency_key']::text[], null::text),
    ('public', 'trackmcp_alert_incidents_identity_evaluation_idx', true, array['workspace_id','identity','evaluation_key']::text[], null::text),
    ('public', 'trackmcp_alert_destinations_workspace_enabled_idx', false, array['workspace_id','enabled','revoked_at']::text[], null::text),
    ('public', 'trackmcp_alert_evaluation_runs_started_idx', false, array['started_at']::text[], null::text),
    ('public', 'trackmcp_alert_evaluation_runs_key_idx', true, array['lock_key','evaluation_key']::text[], null::text)
  ) as indexes(schema_name, index_name, expected_unique, expected_columns, expected_predicate)
  loop
    select i.indisunique, array_agg(a.attname order by key.ord), case when i.indpred is null then null else lower(regexp_replace(pg_get_expr(i.indpred, i.indrelid), '\s+', '', 'g')) end
      into actual_unique, actual_columns, actual_predicate
      from pg_index i
      cross join lateral unnest(i.indkey) with ordinality as key(attnum, ord)
      left join pg_attribute a on a.attrelid = i.indrelid and a.attnum = key.attnum
     where i.indexrelid = to_regclass(expected.schema_name || '.' || expected.index_name)
     group by i.indexrelid, i.indisunique, i.indpred, i.indrelid;
    if not found or actual_unique is distinct from expected.expected_unique or actual_columns is distinct from expected.expected_columns or actual_predicate is distinct from expected.expected_predicate then
      raise exception '% exists with incompatible definition: %', expected.schema_name || '.' || expected.index_name, coalesce(pg_get_indexdef(to_regclass(expected.schema_name || '.' || expected.index_name)), '<missing>');
    end if;
  end loop;
end
$$;

-- Validate every alert CHECK constraint, including constraints not needed by
-- the evaluator itself. This prevents a same-named partial or weakened
-- definition from passing an idempotent replay.
do $$
declare
  expected record;
  definition text;
begin
  for expected in select * from (values
    ('trackmcp_alert_destinations', 'trackmcp_alert_destinations_endpoint_check', 'check((((kind=''webhook''::text)and(endpoint_urlisnotnull))or(kind=''email''::text)))'),
    ('trackmcp_alert_destinations', 'trackmcp_alert_destinations_secret_ref_check', 'check(((length(secret_ref)>=1)and(length(secret_ref)<=512)))'),
    ('trackmcp_alert_configs', 'trackmcp_alert_configs_tool_name_check', 'check(((tool_nameisnull)or((length(tool_name)>=1)and(length(tool_name)<=2048))))'),
    ('trackmcp_alert_configs', 'trackmcp_alert_configs_environment_check', 'check(((environmentisnull)or((length(environment)>=1)and(length(environment)<=128))))'),
    ('trackmcp_alert_configs', 'trackmcp_alert_configs_policy_check', 'check((policy_version=''p1-05-v1''::text))'),
    ('trackmcp_alert_configs', 'trackmcp_alert_configs_destinations_check', 'check(((cardinality(destination_ids)>=0)and(cardinality(destination_ids)<=10)))'),
    ('trackmcp_alert_incidents', 'trackmcp_alert_incidents_metric_check', 'check((metric=any(array[''tool_error_rate_spike''::text,''p95_latency_regression''::text,''empty_result_spike''::text,''retry_loop_spike''::text,''catalog_description_drift''::text,''workflow_completion_drop''::text,''authorization_failure_spike''::text,''deployment_comparison''::text])))'),
    ('trackmcp_alert_incidents', 'trackmcp_alert_incidents_data_status_check', 'check((data_status=any(array[''sufficient''::text,''insufficient_data''::text,''partial''::text])))'),
    ('trackmcp_alert_incidents', 'trackmcp_alert_incidents_severity_check', 'check(((severityisnull)or(severity=any(array[''warning''::text,''critical''::text]))))'),
    ('trackmcp_alert_incidents', 'trackmcp_alert_incidents_revision_check', 'check((revision>=1))'),
    ('trackmcp_alert_deliveries', 'trackmcp_alert_deliveries_http_status_check', 'check(((http_statusisnull)or((http_status>=100)and(http_status<=599))))'),
    ('trackmcp_alert_evaluation_runs', 'trackmcp_alert_evaluation_runs_state_check', 'check((state=any(array[''started''::text,''succeeded''::text,''failed''::text])))'),
    ('trackmcp_alert_evaluation_runs', 'trackmcp_alert_evaluation_runs_count_check', 'check((((config_count>=0)and(config_count<=1000))and((incident_count>=0)and(incident_count<=10000))))'),
    ('trackmcp_alert_evaluation_runs', 'trackmcp_alert_evaluation_runs_key_check', 'check((((length(lock_key)>=1)and(length(lock_key)<=2048))and((length(evaluation_key)>=1)and(length(evaluation_key)<=2048))))')
  ) as checks(table_name, constraint_name, expected_definition)
  loop
    select lower(regexp_replace(pg_get_constraintdef(oid), '\s+', '', 'g')) into definition
      from pg_constraint
     where conrelid = ('public.' || expected.table_name)::regclass
       and conname = expected.constraint_name;
    if not found or definition <> expected.expected_definition then
      raise exception '% is missing or incompatible: %', expected.constraint_name, coalesce(definition, '<missing>');
    end if;
  end loop;
end
$$;

alter table public.trackmcp_alert_destinations enable row level security;
alter table public.trackmcp_alert_configs enable row level security;
alter table public.trackmcp_alert_incidents enable row level security;
alter table public.trackmcp_alert_deliveries enable row level security;
alter table public.trackmcp_alert_evaluation_locks enable row level security;
alter table public.trackmcp_alert_evaluation_runs enable row level security;

revoke all on public.trackmcp_alert_destinations from anon, authenticated;
revoke all on public.trackmcp_alert_configs from anon, authenticated;
revoke all on public.trackmcp_alert_incidents from anon, authenticated;
revoke all on public.trackmcp_alert_deliveries from anon, authenticated;
revoke all on public.trackmcp_alert_evaluation_locks from anon, authenticated;
revoke all on public.trackmcp_alert_evaluation_runs from anon, authenticated;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'trackmcp_alert_configs' and policyname = 'trackmcp_alert_configs_deny_direct') then
    create policy trackmcp_alert_configs_deny_direct on public.trackmcp_alert_configs for all to anon, authenticated using (false) with check (false);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'trackmcp_alert_destinations' and policyname = 'trackmcp_alert_destinations_deny_direct') then
    create policy trackmcp_alert_destinations_deny_direct on public.trackmcp_alert_destinations for all to anon, authenticated using (false) with check (false);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'trackmcp_alert_incidents' and policyname = 'trackmcp_alert_incidents_deny_direct') then
    create policy trackmcp_alert_incidents_deny_direct on public.trackmcp_alert_incidents for all to anon, authenticated using (false) with check (false);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'trackmcp_alert_deliveries' and policyname = 'trackmcp_alert_deliveries_deny_direct') then
    create policy trackmcp_alert_deliveries_deny_direct on public.trackmcp_alert_deliveries for all to anon, authenticated using (false) with check (false);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'trackmcp_alert_evaluation_locks' and policyname = 'trackmcp_alert_evaluation_locks_deny_direct') then
    create policy trackmcp_alert_evaluation_locks_deny_direct on public.trackmcp_alert_evaluation_locks for all to anon, authenticated using (false) with check (false);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'trackmcp_alert_evaluation_runs' and policyname = 'trackmcp_alert_evaluation_runs_deny_direct') then
    create policy trackmcp_alert_evaluation_runs_deny_direct on public.trackmcp_alert_evaluation_runs for all to anon, authenticated using (false) with check (false);
  end if;
end
$$;

revoke all on function public.trackmcp_claim_alert_evaluation(text, text, timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function public.trackmcp_release_alert_evaluation(text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.trackmcp_claim_alert_evaluation(text, text, timestamptz, timestamptz) to service_role;
grant execute on function public.trackmcp_release_alert_evaluation(text, text, timestamptz) to service_role;

-- The application uses the service-role client after resolving workspace membership.
-- No public policy is added, so an API client cannot bypass that application boundary.

commit;
