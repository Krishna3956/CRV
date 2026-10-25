-- Founder OS migration execution ledger.
-- Additive release evidence only; this migration does not alter or delete
-- customer data. Operators record the reviewed migration batch after applying
-- the release and the read-only postflight.

create table if not exists public.trackmcp_migration_execution (
  id uuid primary key default gen_random_uuid(),
  migration_version text not null,
  applied_at timestamptz not null default now(),
  applied_by text not null,
  release_sha text,
  postflight_reference text,
  notes text,
  created_at timestamptz not null default now(),
  constraint trackmcp_migration_execution_version_check
    check (migration_version ~ '^[0-9]{14}_[a-z0-9_]+$'),
  constraint trackmcp_migration_execution_applied_by_check
    check (length(btrim(applied_by)) between 2 and 200),
  constraint trackmcp_migration_execution_release_sha_check
    check (release_sha is null or release_sha ~ '^[0-9a-f]{7,64}$'),
  constraint trackmcp_migration_execution_postflight_check
    check (postflight_reference is null or length(btrim(postflight_reference)) between 1 and 240)
);

create unique index if not exists trackmcp_migration_execution_version_idx
  on public.trackmcp_migration_execution (migration_version);

create index if not exists trackmcp_migration_execution_applied_at_idx
  on public.trackmcp_migration_execution (applied_at desc);

alter table public.trackmcp_migration_execution enable row level security;

comment on table public.trackmcp_migration_execution is
  'Release evidence for reviewed schema batches; never contains credentials or customer payloads.';
comment on column public.trackmcp_migration_execution.applied_by is
  'Bounded operator or automation identity; do not store an email address or secret.';
comment on column public.trackmcp_migration_execution.postflight_reference is
  'Bounded reference to the reviewed read-only postflight output.';
