-- Founder OS alert-to-Action-Queue link.
-- REVIEW ONLY: do not execute automatically. Additive; no backfill or deletion.
-- The value is the deterministic SHA-256 queue fingerprint, never raw event data.

alter table public.trackmcp_alert_incidents
  add column if not exists action_queue_fingerprint text;

do $$ begin
  alter table public.trackmcp_alert_incidents
    add constraint trackmcp_alert_incidents_action_queue_fingerprint_shape
    check (action_queue_fingerprint is null or action_queue_fingerprint ~ '^[0-9a-f]{64}$');
exception when duplicate_object then null; end $$;

create index if not exists trackmcp_alert_incidents_action_queue_fingerprint_idx
  on public.trackmcp_alert_incidents (workspace_id, action_queue_fingerprint)
  where action_queue_fingerprint is not null;

comment on column public.trackmcp_alert_incidents.action_queue_fingerprint is
  'Deterministic workspace-scoped SHA-256 fingerprint matching trackmcp_action_queue.fingerprint; contains no event payload or secret.';
