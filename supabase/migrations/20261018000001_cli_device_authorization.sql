-- TrackMCP CLI device authorization and backend activation milestones.
-- REVIEW ONLY: apply manually in an approved environment; never use supabase db push.
-- Retention: delete expired/denied/redeemed device sessions after 24 hours via an
-- authenticated operator job. Keep activation milestones for the approved product
-- analytics retention period. No raw device/user codes or API keys are stored.

create table if not exists public.trackmcp_cli_device_sessions (
  id uuid primary key default gen_random_uuid(),
  device_code_hash text not null unique,
  user_code_hash text not null unique,
  status text not null default 'pending' check (status in ('pending', 'approved', 'denied', 'redeeming', 'redeemed', 'expired')),
  client_version text not null check (char_length(client_version) between 1 and 64),
  platform text not null check (char_length(platform) between 1 and 64),
  package_manager text not null check (package_manager in ('npm', 'pnpm', 'yarn', 'bun', 'unknown')),
  sdk_package text not null default '@trackmcp/sdk' check (char_length(sdk_package) between 1 and 128),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  last_polled_at timestamptz,
  poll_count integer not null default 0 check (poll_count between 0 and 10000),
  last_slow_down_at timestamptz,
  approved_user_id uuid references auth.users(id) on delete set null,
  approved_workspace_id uuid references public.trackmcp_workspaces(id) on delete set null,
  redeemed_at timestamptz,
  created_key_id uuid references public.trackmcp_api_keys(id) on delete set null,
  constraint trackmcp_cli_device_sessions_expiry_check check (expires_at > created_at and expires_at <= created_at + interval '15 minutes'),
  constraint trackmcp_cli_device_sessions_approval_check check ((status in ('approved', 'redeeming', 'redeemed') and approved_user_id is not null and approved_workspace_id is not null) or status in ('pending', 'denied', 'expired')),
  constraint trackmcp_cli_device_sessions_redeem_check check ((status in ('redeeming', 'redeemed') and redeemed_at is not null) or status not in ('redeeming', 'redeemed'))
);

create index if not exists trackmcp_cli_device_sessions_expiry_idx
  on public.trackmcp_cli_device_sessions (expires_at, status);
create index if not exists trackmcp_cli_device_sessions_approval_idx
  on public.trackmcp_cli_device_sessions (approved_user_id, approved_workspace_id, created_at desc);

create table if not exists public.trackmcp_activation_milestones (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.trackmcp_workspaces(id) on delete cascade,
  key_id uuid not null references public.trackmcp_api_keys(id) on delete cascade,
  first_accepted_at timestamptz not null default now(),
  sdk_version text check (sdk_version is null or char_length(sdk_version) <= 64),
  service text not null check (char_length(service) between 1 and 128),
  environment text not null check (char_length(environment) between 1 and 64),
  event_type text not null check (event_type in ('protocol', 'tool_call', 'session', 'catalog', 'workflow', 'custom')),
  observation_source text not null default 'server' check (observation_source in ('server', 'client', 'legacy_unknown')),
  created_at timestamptz not null default now(),
  unique (workspace_id, key_id)
);

create index if not exists trackmcp_activation_milestones_workspace_first_idx
  on public.trackmcp_activation_milestones (workspace_id, first_accepted_at desc);

alter table public.trackmcp_cli_device_sessions enable row level security;
alter table public.trackmcp_activation_milestones enable row level security;
revoke all on public.trackmcp_cli_device_sessions from anon, authenticated;
revoke all on public.trackmcp_activation_milestones from anon, authenticated;
revoke all on public.trackmcp_cli_device_sessions from public;
revoke all on public.trackmcp_activation_milestones from public;

comment on table public.trackmcp_cli_device_sessions is 'Service-controlled, short-lived CLI device sessions. Raw codes, keys, passwords, email, and project paths are intentionally absent.';
comment on table public.trackmcp_activation_milestones is 'Idempotent first accepted ingest facts; contains bounded metadata only and no raw payload or API key.';
comment on column public.trackmcp_cli_device_sessions.last_polled_at is 'Used with poll_count and last_slow_down_at for service-side rate limiting.';
