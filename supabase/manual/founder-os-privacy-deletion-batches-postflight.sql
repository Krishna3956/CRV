-- Read-only postflight for 20261018000012_privacy_deletion_batches.sql.
-- It reports schema and state only; it never mutates rows.

select
  to_regclass('public.trackmcp_privacy_deletion_batches') as deletion_batches_table,
  (select count(*) from pg_indexes where schemaname = 'public'
    and indexname in (
      'trackmcp_privacy_deletion_batches_request_idx',
      'trackmcp_privacy_deletion_batches_processing_idx'
    )) as expected_index_count,
  has_table_privilege('anon', 'public.trackmcp_privacy_deletion_batches', 'select') as anon_can_select,
  has_table_privilege('authenticated', 'public.trackmcp_privacy_deletion_batches', 'select') as authenticated_can_select;

select status, dry_run, count(*)
from public.trackmcp_privacy_deletion_batches
group by status, dry_run
order by status, dry_run;
