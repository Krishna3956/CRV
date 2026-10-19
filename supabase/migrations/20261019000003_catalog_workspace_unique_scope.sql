-- Founder OS catalog snapshot tenant-scoped uniqueness.
-- REVIEW ONLY: replace the legacy uniqueness boundary so snapshots from two
-- workspaces cannot collide. No rows are deleted or updated.

drop index if exists public.trackmcp_catalog_versions_snapshot_hash_idx;

create unique index if not exists trackmcp_catalog_versions_snapshot_hash_idx
  on public.trackmcp_catalog_versions (
    workspace_id,
    server_id,
    environment_id,
    catalog_kind,
    snapshot_hash
  )
  where snapshot_hash is not null;

comment on index public.trackmcp_catalog_versions_snapshot_hash_idx is
  'Workspace-scoped catalog snapshot identity; legacy rows with null workspace_id remain distinct.';
