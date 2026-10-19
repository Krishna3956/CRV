-- MCP 2026-07-28 MRTR evidence contract.
-- Review-only additive migration. Stores bounded counts and hashes only; never raw requests or responses.

alter table public.trackmcp_events
  add column if not exists input_request_count integer;

alter table public.trackmcp_events
  drop constraint if exists trackmcp_events_result_type_check,
  drop constraint if exists trackmcp_events_input_request_count_check;

alter table public.trackmcp_events
  add constraint trackmcp_events_result_type_check
    check (result_type is null or result_type in ('complete', 'input_required', 'task')),
  add constraint trackmcp_events_input_request_count_check
    check (input_request_count is null or input_request_count between 0 and 100);

comment on column public.trackmcp_events.input_request_count is
  'Bounded count of server input requests for MRTR evidence; raw request contents are never stored.';
