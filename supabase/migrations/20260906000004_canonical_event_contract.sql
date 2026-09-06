-- P0-01 canonical TrackMCP event contract.
-- Existing rows are treated as legacy input; new ingest writes schema_version = '1'.

alter table public.trackmcp_events
  add column if not exists schema_version text not null default 'legacy',
  add column if not exists client_version text,
  add column if not exists tool_description text,
  add column if not exists tool_description_hash text,
  add column if not exists payload_policy text;

-- Keep the existing unique key (workspace_id, event_id) as the idempotency boundary.
-- NOT VALID preserves any pre-existing dirty rows while enforcing the contract for new writes.
alter table public.trackmcp_events
  drop constraint if exists trackmcp_events_non_negative_measurements_check;
alter table public.trackmcp_events
  add constraint trackmcp_events_non_negative_measurements_check
  check (
    (duration_ms is null or duration_ms >= 0)
    and (retry_number is null or retry_number >= 0)
    and (payload_size_bytes is null or payload_size_bytes >= 0)
  ) not valid;

alter table public.trackmcp_events
  drop constraint if exists trackmcp_events_payload_policy_check;
alter table public.trackmcp_events
  add constraint trackmcp_events_payload_policy_check
  check (payload_policy is null or payload_policy in ('metadata', 'redacted', 'full')) not valid;

create index if not exists trackmcp_events_workspace_type_started_idx
  on public.trackmcp_events (workspace_id, event_type, started_at desc);
create index if not exists trackmcp_events_workspace_tool_started_idx
  on public.trackmcp_events (workspace_id, tool_name, started_at desc);
create index if not exists trackmcp_events_workspace_session_started_idx
  on public.trackmcp_events (workspace_id, session_id, started_at);
create index if not exists trackmcp_events_workspace_deployment_started_idx
  on public.trackmcp_events (workspace_id, deployment_id, started_at desc);
