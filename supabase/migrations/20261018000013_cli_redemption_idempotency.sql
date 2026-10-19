-- TrackMCP CLI redemption idempotency contract.
-- REVIEW ONLY: stores a hash of the client retry identity; never stores the
-- raw redemption id or an API key and never mutates existing session states.

alter table public.trackmcp_cli_device_sessions
  add column if not exists redemption_id_hash text;

alter table public.trackmcp_cli_device_sessions
  drop constraint if exists trackmcp_cli_device_sessions_redemption_id_hash_check;

alter table public.trackmcp_cli_device_sessions
  add constraint trackmcp_cli_device_sessions_redemption_id_hash_check
  check (redemption_id_hash is null or redemption_id_hash ~ '^[a-f0-9]{64}$');

create unique index if not exists trackmcp_cli_device_sessions_redemption_id_idx
  on public.trackmcp_cli_device_sessions (id, redemption_id_hash)
  where redemption_id_hash is not null;

comment on column public.trackmcp_cli_device_sessions.redemption_id_hash is
  'SHA-256 of the bounded CLI redemption retry identity; raw id and API keys are never stored.';
