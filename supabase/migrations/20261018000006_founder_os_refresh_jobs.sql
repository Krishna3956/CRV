-- Founder OS durable derived-data jobs.
-- REVIEW ONLY: do not execute automatically. Additive; no backfill/deletion.

create table if not exists public.trackmcp_refresh_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.trackmcp_workspaces(id) on delete cascade,
  kind text not null check (kind in ('fact_projection', 'action_queue_refresh', 'catalog_recompute', 'retention_cleanup')),
  dedupe_key text not null check (char_length(dedupe_key) between 1 and 200),
  state text not null default 'queued' check (state in ('queued', 'running', 'retryable', 'succeeded', 'failed', 'cancelled')),
  attempt_count integer not null default 0 check (attempt_count >= 0 and attempt_count <= 8),
  max_attempts integer not null default 5 check (max_attempts between 1 and 8),
  available_at timestamptz not null default now(),
  lease_owner text,
  lease_until timestamptz,
  last_error_code text check (last_error_code is null or char_length(last_error_code) <= 80),
  last_error_detail text check (last_error_detail is null or char_length(last_error_detail) <= 240),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create unique index if not exists trackmcp_refresh_jobs_dedupe_idx
  on public.trackmcp_refresh_jobs (workspace_id, kind, dedupe_key);
create index if not exists trackmcp_refresh_jobs_due_idx
  on public.trackmcp_refresh_jobs (state, available_at)
  where state in ('queued', 'retryable');
create index if not exists trackmcp_refresh_jobs_lease_idx
  on public.trackmcp_refresh_jobs (lease_until)
  where state = 'running';

alter table public.trackmcp_refresh_jobs enable row level security;
revoke all on public.trackmcp_refresh_jobs from anon, authenticated;
comment on table public.trackmcp_refresh_jobs is 'Bounded, idempotent worker jobs for Founder OS derived read models; service-role worker only.';
