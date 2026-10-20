-- Founder OS catalog snapshot tenant-scoped uniqueness.
-- REVIEW ONLY: replace the legacy uniqueness boundary so snapshots from two
-- workspaces cannot collide. No rows are deleted or updated.

drop index if exists public.trackmcp_catalog_versions_snapshot_hash_idx;

alter table public.trackmcp_catalog_versions
  drop constraint if exists trackmcp_catalog_versions_snapshot_hash_idx;

alter table public.trackmcp_catalog_versions
  add constraint trackmcp_catalog_versions_snapshot_hash_idx unique (
    workspace_id,
    server_id,
    environment_id,
    catalog_kind,
    snapshot_hash
  );

comment on constraint trackmcp_catalog_versions_snapshot_hash_idx on public.trackmcp_catalog_versions is
  'Workspace-scoped catalog snapshot identity; PostgreSQL treats null snapshot values as distinct.';
