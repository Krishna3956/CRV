-- Protocol-aware observability model. Raw events remain the source of truth;
-- these dimensions make the product queryable without putting business meaning
-- into arbitrary JSON payloads.

alter table public.trackmcp_events
  drop constraint if exists trackmcp_events_event_type_check;

alter table public.trackmcp_events
  add column if not exists server_id uuid,
  add column if not exists environment_id uuid,
  add column if not exists deployment_id uuid,
  add column if not exists server_version text,
  add column if not exists sdk_version text,
  add column if not exists direction text,
  add column if not exists transport text,
  add column if not exists protocol_version text,
  add column if not exists mcp_method text,
  add column if not exists request_id text,
  add column if not exists task_id text,
  add column if not exists workflow_id text,
  add column if not exists error_class text,
  add column if not exists error_code integer,
  add column if not exists retry_number integer not null default 0,
  add column if not exists schema_hash text,
  add column if not exists payload_size_bytes integer;

create table if not exists public.trackmcp_servers (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.trackmcp_workspaces(id) on delete cascade,
  name text not null,
  slug text not null,
  created_at timestamptz not null default now(),
  unique (workspace_id, slug)
);

create table if not exists public.trackmcp_environments (
  id uuid primary key default gen_random_uuid(),
  server_id uuid not null references public.trackmcp_servers(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (server_id, name)
);

create table if not exists public.trackmcp_deployments (
  id uuid primary key default gen_random_uuid(),
  environment_id uuid not null references public.trackmcp_environments(id) on delete cascade,
  version text,
  commit_sha text,
  sdk_version text,
  protocol_version text,
  deployed_at timestamptz not null default now()
);

create table if not exists public.trackmcp_catalog_versions (
  id uuid primary key default gen_random_uuid(),
  server_id uuid not null references public.trackmcp_servers(id) on delete cascade,
  environment_id uuid references public.trackmcp_environments(id) on delete set null,
  session_id text,
  protocol_version text,
  capabilities jsonb not null default '{}'::jsonb,
  catalog jsonb not null default '{}'::jsonb,
  catalog_hash text,
  discovered_at timestamptz not null default now()
);

create index if not exists trackmcp_events_workspace_method_idx
  on public.trackmcp_events (workspace_id, mcp_method, started_at desc);
create index if not exists trackmcp_events_workspace_deployment_idx
  on public.trackmcp_events (workspace_id, deployment_id, started_at desc);
create index if not exists trackmcp_catalog_server_discovered_idx
  on public.trackmcp_catalog_versions (server_id, discovered_at desc);

alter table public.trackmcp_servers enable row level security;
alter table public.trackmcp_environments enable row level security;
alter table public.trackmcp_deployments enable row level security;
alter table public.trackmcp_catalog_versions enable row level security;

revoke all on public.trackmcp_servers from anon, authenticated;
revoke all on public.trackmcp_environments from anon, authenticated;
revoke all on public.trackmcp_deployments from anon, authenticated;
revoke all on public.trackmcp_catalog_versions from anon, authenticated;
