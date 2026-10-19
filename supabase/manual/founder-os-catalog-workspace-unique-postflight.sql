-- Read-only postflight for 20261019000003_catalog_workspace_unique_scope.sql.
-- Confirms the snapshot identity index includes workspace_id and does not
-- inspect or mutate catalog payloads.

select
  to_regclass('public.trackmcp_catalog_versions') is not null as has_catalog_versions,
  exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'trackmcp_catalog_versions'
      and indexname = 'trackmcp_catalog_versions_snapshot_hash_idx'
      and indexdef ilike '%(workspace_id, server_id, environment_id, catalog_kind, snapshot_hash)%'
  ) as has_workspace_scoped_snapshot_index;

select
  count(*) filter (where workspace_id is null) as legacy_unscoped_rows,
  count(*) filter (where workspace_id is not null) as workspace_scoped_rows,
  count(*) filter (where snapshot_hash is not null and workspace_id is null) as legacy_hashed_rows
from public.trackmcp_catalog_versions;
