-- Read-only postflight for 20261018000008_catalog_snapshot_versions.sql and
-- 20261018000011_catalog_workspace_scope.sql.
select
  to_regclass('public.trackmcp_catalog_versions') is not null as has_catalog_versions,
  exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'trackmcp_catalog_versions' and column_name = 'snapshot_hash') as has_snapshot_hash,
  exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'trackmcp_catalog_versions' and column_name = 'previous_snapshot_id') as has_previous_snapshot_id,
  exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'trackmcp_catalog_versions' and column_name = 'workspace_id') as has_workspace_scope,
  exists (select 1 from pg_indexes where schemaname = 'public' and tablename = 'trackmcp_catalog_versions' and indexname = 'trackmcp_catalog_versions_scope_idx') as has_scope_index,
  exists (select 1 from pg_indexes where schemaname = 'public' and tablename = 'trackmcp_catalog_versions' and indexname = 'trackmcp_catalog_versions_snapshot_hash_idx') as has_snapshot_index,
  exists (select 1 from pg_indexes where schemaname = 'public' and tablename = 'trackmcp_catalog_versions' and indexname = 'trackmcp_catalog_versions_workspace_scope_idx') as has_workspace_index;

select
  count(*) as snapshot_rows,
  count(*) filter (where snapshot_hash is not null) as hashed_snapshot_rows,
  count(*) filter (where complete and not truncated) as complete_snapshot_rows,
  coalesce(max(jsonb_array_length(item_name_hashes)), 0) as max_name_hashes,
  coalesce(max(jsonb_array_length(item_uri_hashes)), 0) as max_uri_hashes,
  coalesce(max(pg_column_size(diff)), 0) as max_diff_bytes
from public.trackmcp_catalog_versions;
