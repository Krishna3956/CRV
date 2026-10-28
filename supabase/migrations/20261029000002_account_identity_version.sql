-- Account identity derivation namespaces are explicit before any future resolver rotation.
-- Review and apply manually only after the application contract is approved.
-- This migration includes an explicit release review for its constraint replacement.

alter table public.trackmcp_events
  add column if not exists account_identity_version text;

-- Existing SHA-256 account keys are assigned the only currently supported namespace.
update public.trackmcp_events
set account_identity_version = 'sha256-v1'
where account_key is not null and account_identity_version is null;

alter table public.trackmcp_events
  drop constraint if exists trackmcp_events_account_identity_version_check;

alter table public.trackmcp_events
  add constraint trackmcp_events_account_identity_version_check
  check (
    (account_key is null and account_identity_version is null)
    or (account_key is not null and account_identity_version = 'sha256-v1')
  );

create index if not exists trackmcp_events_workspace_account_identity_started_idx
  on public.trackmcp_events (workspace_id, account_identity_version, account_key, started_at desc);

comment on column public.trackmcp_events.account_identity_version is
  'Derivation namespace for account_key. sha256-v1 is the current one-way resolver contract; rotations must use a new version.';
