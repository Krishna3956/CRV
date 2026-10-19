-- Founder OS action-queue lifecycle metadata.
-- REVIEW ONLY: do not execute automatically. Additive; no backfill or deletion.

alter table public.trackmcp_action_queue
  add column if not exists acknowledged_at timestamptz,
  add column if not exists acknowledged_by uuid,
  add column if not exists snoozed_at timestamptz,
  add column if not exists snoozed_until timestamptz,
  add column if not exists snoozed_by uuid,
  add column if not exists resolved_by uuid,
  add column if not exists resolution_note text,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists revision integer not null default 1;

do $$ begin
  alter table public.trackmcp_action_queue add constraint trackmcp_action_queue_resolution_note_length
    check (resolution_note is null or char_length(resolution_note) <= 500);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.trackmcp_action_queue add constraint trackmcp_action_queue_snooze_bounds
    check (status <> 'snoozed' or snoozed_until is not null);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.trackmcp_action_queue add constraint trackmcp_action_queue_revision_positive
    check (revision > 0);
exception when duplicate_object then null; end $$;

create index if not exists trackmcp_action_queue_snoozed_until_idx
  on public.trackmcp_action_queue (workspace_id, snoozed_until)
  where status = 'snoozed';

comment on column public.trackmcp_action_queue.revision is
  'Optimistic concurrency version; lifecycle writers must predicate updates on the previous revision.';
comment on column public.trackmcp_action_queue.resolution_note is
  'Bounded operator note; never store raw event payloads or secrets.';
