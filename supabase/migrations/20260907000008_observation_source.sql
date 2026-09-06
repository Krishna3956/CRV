-- P1-04: persist the observer boundary for new client and server events.
-- Forward-only and transactional. Existing rows remain NULL (legacy_unknown).

begin;

alter table public.trackmcp_events
  add column if not exists observation_source text;

do $$
declare
  existing_definition text;
  expected_definition text := 'CHECK (((observation_source IS NULL) OR (observation_source = ANY (ARRAY[''client''::text, ''server''::text]))))';
begin
  select pg_get_constraintdef(oid)
    into existing_definition
    from pg_constraint
   where conrelid = 'public.trackmcp_events'::regclass
     and conname = 'trackmcp_events_observation_source_check';

  if existing_definition is null then
    alter table public.trackmcp_events
      add constraint trackmcp_events_observation_source_check
      check (observation_source is null or observation_source in ('client', 'server'));
  elsif regexp_replace(lower(existing_definition), '\s+', '', 'g')
        <> regexp_replace(lower(expected_definition), '\s+', '', 'g') then
    raise exception 'trackmcp_events_observation_source_check exists with incompatible definition: %', existing_definition;
  end if;
end
$$;

create index if not exists trackmcp_events_workspace_observation_source_started_idx
  on public.trackmcp_events (workspace_id, observation_source, started_at desc);

commit;
