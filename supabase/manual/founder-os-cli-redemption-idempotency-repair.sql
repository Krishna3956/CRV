-- TrackMCP CLI redemption-idempotency repair.
-- Run only after confirming redemption_id_hash exists and the audit reported
-- the index and constraint as missing. This adds enforcement only; it does
-- not rewrite, delete, or backfill any rows.

alter table public.trackmcp_cli_device_sessions
  drop constraint if exists trackmcp_cli_device_sessions_redemption_id_hash_check;

alter table public.trackmcp_cli_device_sessions
  add constraint trackmcp_cli_device_sessions_redemption_id_hash_check
  check (
    redemption_id_hash is null
    or redemption_id_hash ~ '^[a-f0-9]{64}$'
  );

create unique index if not exists trackmcp_cli_device_sessions_redemption_id_idx
  on public.trackmcp_cli_device_sessions (id, redemption_id_hash)
  where redemption_id_hash is not null;
