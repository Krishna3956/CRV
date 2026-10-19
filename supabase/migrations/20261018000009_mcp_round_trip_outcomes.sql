-- Founder OS MCP round-trip outcome contract.
-- Review-only: additive, no backfill, no raw inputResponses/requestState storage.

alter table public.trackmcp_events
  add column if not exists result_type text,
  add column if not exists interaction_id text,
  add column if not exists interaction_link_source text not null default 'missing',
  add column if not exists retry_of_event_id text,
  add column if not exists request_state_hash text,
  add column if not exists input_response_count integer,
  add column if not exists resource_audience text,
  add column if not exists resource_priority numeric;

alter table public.trackmcp_events
  drop constraint if exists trackmcp_events_result_type_check,
  drop constraint if exists trackmcp_events_interaction_id_check,
  drop constraint if exists trackmcp_events_interaction_link_source_check,
  drop constraint if exists trackmcp_events_retry_of_event_id_check,
  drop constraint if exists trackmcp_events_request_state_hash_check,
  drop constraint if exists trackmcp_events_input_response_count_check,
  drop constraint if exists trackmcp_events_resource_audience_check,
  drop constraint if exists trackmcp_events_resource_priority_check;

alter table public.trackmcp_events
  add constraint trackmcp_events_result_type_check
    check (result_type is null or result_type in ('complete', 'input_required')),
  add constraint trackmcp_events_interaction_id_check
    check (interaction_id is null or char_length(interaction_id) between 1 and 128),
  add constraint trackmcp_events_interaction_link_source_check
    check (interaction_link_source in ('request_id', 'external', 'issued', 'missing')),
  add constraint trackmcp_events_retry_of_event_id_check
    check (retry_of_event_id is null or char_length(retry_of_event_id) between 1 and 128),
  add constraint trackmcp_events_request_state_hash_check
    check (request_state_hash is null or request_state_hash ~ '^[0-9a-f]{64}$'),
  add constraint trackmcp_events_input_response_count_check
    check (input_response_count is null or input_response_count between 0 and 100),
  add constraint trackmcp_events_resource_audience_check
    check (resource_audience is null or resource_audience in ('user', 'assistant')),
  add constraint trackmcp_events_resource_priority_check
    check (resource_priority is null or (resource_priority >= 0 and resource_priority <= 1));

create index if not exists trackmcp_events_workspace_interaction_idx
  on public.trackmcp_events (workspace_id, interaction_id, started_at asc)
  where interaction_id is not null;

comment on column public.trackmcp_events.result_type is
  'MCP multi-round-trip state; missing is backward-compatible complete for resources/read and prompts/get.';
comment on column public.trackmcp_events.request_state_hash is
  'SHA-256 of requestState; raw state and inputResponses are never stored.';
