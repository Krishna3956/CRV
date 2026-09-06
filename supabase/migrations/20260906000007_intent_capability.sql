-- P1-02: persist explicit intent provenance and missing-capability reports.
-- Forward-only and additive. Apply this migration manually in the authenticated
-- Supabase SQL Editor because production migration history is not synchronized.
alter table public.trackmcp_events
  add column if not exists context text,
  add column if not exists intent_source text not null default 'missing',
  add column if not exists missing_capability text;

alter table public.trackmcp_events
  add constraint trackmcp_events_intent_source_check
  check (intent_source in ('context_parameter', 'external_callback', 'fallback', 'missing'));

alter table public.trackmcp_events
  add constraint trackmcp_events_intent_context_shape_check
  check (
    (context is null and intent_source = 'missing')
    or (context is not null and intent_source in ('context_parameter', 'external_callback', 'fallback') and octet_length(context) between 1 and 2048)
  );

alter table public.trackmcp_events
  add constraint trackmcp_events_missing_capability_shape_check
  check (missing_capability is null or octet_length(missing_capability) between 1 and 2048);

create index if not exists trackmcp_events_workspace_intent_source_idx
  on public.trackmcp_events (workspace_id, intent_source, started_at desc);
create index if not exists trackmcp_events_workspace_missing_capability_idx
  on public.trackmcp_events (workspace_id, missing_capability, started_at desc)
  where missing_capability is not null;
