-- TrackMCP telemetry plane.
-- Run this after the existing mcp_tools table migration/schema.

create extension if not exists pgcrypto;

create table if not exists public.trackmcp_workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.trackmcp_api_keys (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.trackmcp_workspaces(id) on delete cascade,
  name text not null default 'default',
  key_prefix text not null,
  key_hash text not null unique,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.trackmcp_workspace_members (
  workspace_id uuid not null references public.trackmcp_workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table if not exists public.trackmcp_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.trackmcp_workspaces(id) on delete cascade,
  event_id text not null,
  event_type text not null check (event_type in ('tool_call', 'session', 'custom')),
  service text not null,
  environment text not null default 'production',
  session_id text,
  client_name text,
  tool_name text,
  started_at timestamptz not null,
  duration_ms integer,
  success boolean,
  is_error boolean,
  payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now(),
  unique (workspace_id, event_id)
);

create index if not exists trackmcp_events_workspace_started_idx
  on public.trackmcp_events (workspace_id, started_at desc);
create index if not exists trackmcp_events_workspace_tool_idx
  on public.trackmcp_events (workspace_id, tool_name, started_at desc);
create index if not exists trackmcp_events_workspace_session_idx
  on public.trackmcp_events (workspace_id, session_id, started_at);

alter table public.trackmcp_workspaces enable row level security;
alter table public.trackmcp_api_keys enable row level security;
alter table public.trackmcp_workspace_members enable row level security;
alter table public.trackmcp_events enable row level security;

revoke all on public.trackmcp_workspaces from anon, authenticated;
revoke all on public.trackmcp_api_keys from anon, authenticated;
revoke all on public.trackmcp_workspace_members from anon, authenticated;
revoke all on public.trackmcp_events from anon, authenticated;

insert into public.trackmcp_workspaces (name, slug)
values ('TrackMCP Beta', 'trackmcp-beta')
on conflict (slug) do nothing;
