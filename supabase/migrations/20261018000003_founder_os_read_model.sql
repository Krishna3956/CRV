-- Founder OS read-model foundation.
-- Review-only: do not execute until the semantic fact contract and writer are approved.
-- This migration is additive and intentionally contains no backfill or trigger.

create table if not exists public.trackmcp_semantic_facts (
  workspace_id uuid not null references public.trackmcp_workspaces(id) on delete cascade,
  source_event_id text not null,
  fact_version text not null,
  fact_type text not null check (fact_type in ('activity', 'outcome', 'observation')),
  event_type text not null check (event_type in ('protocol', 'tool_call', 'session', 'catalog', 'workflow', 'custom')),
  service text not null,
  environment text not null,
  observed_at timestamptz not null,
  semantic jsonb not null default '{}'::jsonb,
  dimensions jsonb not null default '{}'::jsonb,
  measures jsonb not null default '{}'::jsonb,
  error jsonb,
  created_at timestamptz not null default now(),
  primary key (workspace_id, source_event_id, fact_version),
  check (char_length(source_event_id) between 1 and 128),
  check (char_length(fact_version) between 1 and 32),
  check (char_length(fact_type) between 1 and 32),
  check (char_length(service) between 1 and 128),
  check (char_length(environment) between 1 and 64),
  check (jsonb_typeof(semantic) = 'object'),
  check (jsonb_typeof(dimensions) = 'object'),
  check (jsonb_typeof(measures) = 'object'),
  check (error is null or jsonb_typeof(error) = 'object'),
  check (pg_column_size(semantic) <= 65536),
  check (pg_column_size(dimensions) <= 65536),
  check (pg_column_size(measures) <= 65536),
  check (error is null or pg_column_size(error) <= 65536)
);

create index if not exists trackmcp_semantic_facts_workspace_observed_idx
  on public.trackmcp_semantic_facts (workspace_id, observed_at desc);
create index if not exists trackmcp_semantic_facts_workspace_type_observed_idx
  on public.trackmcp_semantic_facts (workspace_id, fact_type, observed_at desc);

create table if not exists public.trackmcp_action_queue (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.trackmcp_workspaces(id) on delete cascade,
  fingerprint text not null,
  rule_key text not null,
  status text not null default 'open' check (status in ('open', 'acknowledged', 'snoozed', 'resolved')),
  severity text not null check (severity in ('info', 'warn', 'error')),
  title text not null,
  evidence jsonb not null default '{}'::jsonb,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (workspace_id, fingerprint),
  check (char_length(fingerprint) between 1 and 256),
  check (char_length(rule_key) between 1 and 128),
  check (char_length(title) between 1 and 300),
  check (jsonb_typeof(evidence) = 'object'),
  check (pg_column_size(evidence) <= 65536),
  check ((status = 'resolved') = (resolved_at is not null))
);

create index if not exists trackmcp_action_queue_workspace_status_idx
  on public.trackmcp_action_queue (workspace_id, status, last_seen_at desc);

alter table public.trackmcp_semantic_facts enable row level security;
alter table public.trackmcp_action_queue enable row level security;
revoke all on public.trackmcp_semantic_facts from anon, authenticated;
revoke all on public.trackmcp_action_queue from anon, authenticated;

comment on table public.trackmcp_semantic_facts is
  'Versioned bounded product facts projected from trackmcp_events; raw payloads are not copied.';
comment on table public.trackmcp_action_queue is
  'Bounded workspace-scoped investigation signals; records are not diagnoses or verified outcomes.';
