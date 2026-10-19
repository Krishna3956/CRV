-- Founder OS privacy deletion batch audit foundation.
-- REVIEW ONLY: this migration records reviewed batch state; it never deletes
-- customer data and does not authorize a destructive worker.

create table if not exists public.trackmcp_privacy_deletion_batches (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.trackmcp_privacy_requests(id),
  workspace_id uuid not null references public.trackmcp_workspaces(id),
  dataset text not null check (dataset in (
    'events', 'semantic_facts', 'action_queue', 'refresh_jobs',
    'activation_milestones', 'catalog_versions'
  )),
  batch_number integer not null check (batch_number between 0 and 100000),
  after_id text check (after_id is null or char_length(after_id) between 1 and 128),
  status text not null default 'planned' check (status in (
    'planned', 'previewed', 'approved', 'processing', 'completed', 'failed'
  )),
  dry_run boolean not null default true,
  returned_count integer not null default 0 check (returned_count between 0 and 500),
  affected_count integer not null default 0 check (affected_count between 0 and 500),
  error_code text check (error_code is null or char_length(error_code) between 1 and 80),
  error_detail text check (error_detail is null or char_length(error_detail) <= 500),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  audit_metadata jsonb not null default '{}'::jsonb
    check (octet_length(audit_metadata::text) <= 8192),
  unique (request_id, dataset, batch_number),
  constraint trackmcp_privacy_deletion_batches_terminal_timestamps check (
    (status <> 'completed' or completed_at is not null)
    and (status <> 'failed' or error_code is not null)
  )
  -- The request/workspace equality is enforced by the reviewed worker query;
  -- PostgreSQL CHECK constraints cannot safely validate a second table.
);

create index if not exists trackmcp_privacy_deletion_batches_request_idx
  on public.trackmcp_privacy_deletion_batches (request_id, dataset, batch_number);
create index if not exists trackmcp_privacy_deletion_batches_processing_idx
  on public.trackmcp_privacy_deletion_batches (status, updated_at)
  where status in ('approved', 'processing');

alter table public.trackmcp_privacy_deletion_batches enable row level security;
revoke all on public.trackmcp_privacy_deletion_batches from anon, authenticated;

comment on table public.trackmcp_privacy_deletion_batches is
  'Bounded, workspace-scoped audit records for reviewed privacy deletion batches; not a destructive executor.';
comment on column public.trackmcp_privacy_deletion_batches.dry_run is
  'Remains true until a separately reviewed destructive adapter and legal-hold policy exist.';
comment on column public.trackmcp_privacy_deletion_batches.audit_metadata is
  'Bounded non-secret operator context only; never store keys, payloads, tokens, or exported data.';
