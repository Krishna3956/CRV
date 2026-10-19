-- Follow-up hardening for CLI redemption and bounded funnel reporting.
-- REVIEW ONLY: apply manually after 20261018000001 in an approved environment.
-- No raw redemption token, API key, email, IP, or arbitrary payload is stored.

alter table public.trackmcp_cli_device_sessions
  add column if not exists redemption_id_hash text;

create unique index if not exists trackmcp_cli_device_sessions_redemption_idx
  on public.trackmcp_cli_device_sessions (redemption_id_hash)
  where redemption_id_hash is not null;

create table if not exists public.trackmcp_activation_funnel_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique check (char_length(event_id) between 16 and 128),
  event_type text not null check (event_type in (
    'signup_completed', 'workspace_created', 'api_key_created', 'api_key_copied',
    'setup_snippet_copied', 'first_event_check_started', 'first_event_check_result',
    'first_telemetry_seen'
  )),
  source text not null check (source in ('npm', 'sdk_docs', 'github', 'ai', 'direct', 'device', 'unknown')),
  package_name text check (package_name is null or char_length(package_name) between 1 and 128),
  package_version text check (package_version is null or char_length(package_version) between 1 and 64),
  content_path text check (content_path is null or char_length(content_path) between 1 and 256),
  result_category text check (result_category is null or result_category in ('event_found', 'no_event', 'unauthorized', 'permission_denied', 'retryable_error', 'unknown')),
  user_id uuid references auth.users(id) on delete set null,
  workspace_id uuid references public.trackmcp_workspaces(id) on delete set null,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists trackmcp_activation_funnel_events_type_time_idx
  on public.trackmcp_activation_funnel_events (event_type, occurred_at desc);
create index if not exists trackmcp_activation_funnel_events_source_time_idx
  on public.trackmcp_activation_funnel_events (source, occurred_at desc);

alter table public.trackmcp_activation_funnel_events enable row level security;
revoke all on public.trackmcp_activation_funnel_events from anon, authenticated;
revoke all on public.trackmcp_activation_funnel_events from public;

comment on table public.trackmcp_activation_funnel_events is 'Bounded, service-controlled activation facts. No email, IP, key, raw payload, or guessed identity.';
