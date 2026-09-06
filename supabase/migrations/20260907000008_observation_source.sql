-- P1-04: persist the observer boundary for new client and server events.
-- Forward-only and transactional. Existing rows remain NULL (legacy_unknown).

begin;

alter table public.trackmcp_events
  add column if not exists observation_source text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.trackmcp_events'::regclass
      and conname = 'trackmcp_events_observation_source_check'
  ) then
    alter table public.trackmcp_events
      add constraint trackmcp_events_observation_source_check
      check (observation_source is null or observation_source in ('client', 'server'));
  end if;
end
$$;

create index if not exists trackmcp_events_workspace_observation_source_started_idx
  on public.trackmcp_events (workspace_id, observation_source, started_at desc);

commit;
