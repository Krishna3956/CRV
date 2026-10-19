-- Founder OS Phase 1: privacy-safe account attribution on canonical events.
-- Review and apply manually only after the application contract is approved.
-- The SDK stores only a SHA-256-derived account key; raw claims are never persisted.

alter table public.trackmcp_events
  add column if not exists account_key text,
  add column if not exists account_identity_source text;

alter table public.trackmcp_events
  drop constraint if exists trackmcp_events_account_identity_source_check;

alter table public.trackmcp_events
  add constraint trackmcp_events_account_identity_source_check
  check (
    (account_key is null and (account_identity_source is null or account_identity_source = 'unresolved'))
    or (account_key is not null and account_identity_source = 'resolver')
  );

alter table public.trackmcp_events
  drop constraint if exists trackmcp_events_account_key_shape_check;

alter table public.trackmcp_events
  add constraint trackmcp_events_account_key_shape_check
  check (account_key is null or account_key ~ '^[0-9a-f]{64}$');

create index if not exists trackmcp_events_workspace_account_started_idx
  on public.trackmcp_events (workspace_id, account_key, started_at desc);

comment on column public.trackmcp_events.account_key is
  'One-way SHA-256-derived customer account identifier; never a raw claim, token, email, or API key.';
comment on column public.trackmcp_events.account_identity_source is
  'Provenance of account_key: resolver or unresolved. MCP client self-report is not accepted as account identity.';
