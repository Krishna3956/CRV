-- Founder OS durable resources/prompts read identity projection.
-- REVIEW ONLY: additive, hash-only, idempotent, and service-role worker only.

create table if not exists public.trackmcp_catalog_entity_reads (
  workspace_id uuid not null references public.trackmcp_workspaces(id) on delete cascade,
  source_event_id text not null,
  server_id text,
  environment text,
  catalog_kind text not null check (catalog_kind in ('resources', 'prompts')),
  entity_hash text not null check (entity_hash ~ '^[0-9a-f]{64}$'),
  observed_at timestamptz not null,
  success boolean,
  is_error boolean,
  result_type text,
  created_at timestamptz not null default now(),
  primary key (workspace_id, source_event_id, catalog_kind, entity_hash),
  check (char_length(source_event_id) between 1 and 128),
  check (server_id is null or char_length(server_id) between 1 and 128),
  check (environment is null or char_length(environment) between 1 and 64),
  check (result_type is null or char_length(result_type) between 1 and 32)
);

create index if not exists trackmcp_catalog_entity_reads_scope_idx
  on public.trackmcp_catalog_entity_reads (workspace_id, catalog_kind, observed_at desc);
create index if not exists trackmcp_catalog_entity_reads_hash_idx
  on public.trackmcp_catalog_entity_reads (workspace_id, catalog_kind, entity_hash, observed_at desc);

alter table public.trackmcp_catalog_entity_reads enable row level security;
revoke all on public.trackmcp_catalog_entity_reads from anon, authenticated;

comment on table public.trackmcp_catalog_entity_reads is
  'Idempotent service-role projection of hash-only resources/read and prompts/get observations; raw identifiers and content are never stored.';

-- Extend the existing worker vocabulary without rewriting existing rows.
alter table public.trackmcp_refresh_jobs
  drop constraint if exists trackmcp_refresh_jobs_kind_check;
alter table public.trackmcp_refresh_jobs
  add constraint trackmcp_refresh_jobs_kind_check
  check (kind in ('fact_projection', 'action_queue_refresh', 'catalog_recompute', 'catalog_entity_recompute', 'retention_cleanup'));
