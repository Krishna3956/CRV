-- P0-01 follow-up: make session identifier provenance explicit.
-- Existing rows remain nullable because their session provenance cannot be reconstructed safely.

alter table public.trackmcp_events
  add column if not exists session_id_source text;

alter table public.trackmcp_events
  drop constraint if exists trackmcp_events_session_id_source_check;
alter table public.trackmcp_events
  add constraint trackmcp_events_session_id_source_check
  check (session_id_source is null or session_id_source in ('protocol', 'transport_generated', 'external', 'missing')) not valid;
