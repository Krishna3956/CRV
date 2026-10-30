-- Scope durable task evidence by the bounded server/environment provenance that
-- issued the task handle. Additive only: existing rows remain legacy/unknown.
alter table public.trackmcp_task_transitions
  add column if not exists service text,
  add column if not exists environment text,
  add column if not exists server_id text,
  add column if not exists transport text;

alter table public.trackmcp_task_transitions
  add constraint trackmcp_task_transitions_transport_check
  check (transport is null or transport in ('stdio', 'streamable_http', 'sse', 'custom', 'unknown'));

create index if not exists trackmcp_task_transitions_workspace_scope_observed_idx
  on public.trackmcp_task_transitions (workspace_id, service, environment, server_id, transport, observed_at desc);

comment on column public.trackmcp_task_transitions.service is 'Bounded task issuer service; null denotes legacy evidence.';
comment on column public.trackmcp_task_transitions.environment is 'Bounded task issuer environment; null denotes legacy evidence.';
comment on column public.trackmcp_task_transitions.server_id is 'Bounded server scope; raw endpoint URLs are never stored.';
comment on column public.trackmcp_task_transitions.transport is 'Caller-verified transport label; null denotes legacy evidence.';
