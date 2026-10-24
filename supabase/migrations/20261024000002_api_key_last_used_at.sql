-- Additive operational metadata for connection-key rotation and stale-key review.
-- The raw key is never stored; this timestamp is updated only after a valid
-- key lookup and remains workspace-scoped by the existing key row.
alter table public.trackmcp_api_keys
  add column if not exists last_used_at timestamptz;

comment on column public.trackmcp_api_keys.last_used_at is
  'Last accepted authenticated ingest request using this key; no secret or event payload.';

create index if not exists trackmcp_api_keys_workspace_last_used_idx
  on public.trackmcp_api_keys (workspace_id, last_used_at desc nulls last);
