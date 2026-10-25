-- Founder OS migration execution ledger postflight (READ ONLY).
-- Run after the additive migration and after recording the reviewed batch.
-- This returns bounded metadata only; it never exposes payloads or credentials.

select
  to_regclass('public.trackmcp_migration_execution') is not null as ledger_exists;

select
  migration_version,
  applied_at,
  left(applied_by, 200) as applied_by,
  release_sha,
  left(postflight_reference, 240) as postflight_reference,
  left(notes, 240) as notes
from public.trackmcp_migration_execution
order by applied_at desc
limit 50;

select
  count(*)::bigint as recorded_batches,
  count(*) filter (where applied_at <= now())::bigint as timestamped_batches,
  count(*) filter (where release_sha is not null)::bigint as batches_with_release_sha,
  count(*) filter (where postflight_reference is not null)::bigint as batches_with_postflight_reference
from public.trackmcp_migration_execution;
