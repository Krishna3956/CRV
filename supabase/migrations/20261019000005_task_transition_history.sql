-- Founder OS task-transition evidence.
-- Review-only: run manually after approving the task lifecycle contract.
-- Additive, service-role-only, and intentionally contains no backfill.

create table if not exists public.trackmcp_task_transitions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.trackmcp_workspaces(id) on delete cascade,
  source_event_id text not null,
  task_id_hash text not null,
  state text not null check (state in ('working', 'input_required', 'completed', 'failed', 'cancelled', 'expired')),
  observed_at timestamptz not null,
  result_type text check (result_type is null or result_type in ('complete', 'input_required', 'task')),
  evidence_quality text not null check (evidence_quality in ('observed', 'insufficient_data', 'conflicting')),
  created_at timestamptz not null default now(),
  unique (workspace_id, source_event_id),
  check (char_length(source_event_id) between 1 and 128),
  check (task_id_hash ~ '^[a-f0-9]{64}$'),
  check (char_length(task_id_hash) = 64)
);

create index if not exists trackmcp_task_transitions_workspace_task_observed_idx
  on public.trackmcp_task_transitions (workspace_id, task_id_hash, observed_at desc);
create index if not exists trackmcp_task_transitions_workspace_state_observed_idx
  on public.trackmcp_task_transitions (workspace_id, state, observed_at desc);

alter table public.trackmcp_task_transitions enable row level security;
revoke all on public.trackmcp_task_transitions from anon, authenticated;
revoke all on public.trackmcp_task_transitions from public;
grant select, insert, update, delete on public.trackmcp_task_transitions to service_role;

comment on table public.trackmcp_task_transitions is
  'Durable bounded task-state observations; task handles are one-way hashes and raw task payloads are never stored.';
