-- P1-02 manual SQL Editor application.
-- Run as one statement in the authenticated Supabase SQL Editor.
-- This applies only the P1-02 additive columns, constraints, and indexes.
begin;

do $$
begin
  if to_regclass('public.trackmcp_events') is null then
    raise exception 'public.trackmcp_events does not exist; aborting';
  end if;
end
$$;

alter table public.trackmcp_events
  add column if not exists context text,
  add column if not exists intent_source text not null default 'missing',
  add column if not exists missing_capability text;

do $$
begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.trackmcp_events'::regclass and conname = 'trackmcp_events_intent_source_check') then
    alter table public.trackmcp_events add constraint trackmcp_events_intent_source_check
      check (intent_source in ('context_parameter', 'external_callback', 'fallback', 'missing'));
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.trackmcp_events'::regclass and conname = 'trackmcp_events_intent_context_shape_check') then
    alter table public.trackmcp_events add constraint trackmcp_events_intent_context_shape_check
      check (
        (context is null and intent_source = 'missing')
        or (context is not null and intent_source in ('context_parameter', 'external_callback', 'fallback') and octet_length(context) between 1 and 2048)
      );
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.trackmcp_events'::regclass and conname = 'trackmcp_events_missing_capability_shape_check') then
    alter table public.trackmcp_events add constraint trackmcp_events_missing_capability_shape_check
      check (missing_capability is null or octet_length(missing_capability) between 1 and 2048);
  end if;
end
$$;

create index if not exists trackmcp_events_workspace_intent_source_idx
  on public.trackmcp_events (workspace_id, intent_source, started_at desc);
create index if not exists trackmcp_events_workspace_missing_capability_idx
  on public.trackmcp_events (workspace_id, missing_capability, started_at desc)
  where missing_capability is not null;

commit;
