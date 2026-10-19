-- Founder OS catalog versions workspace scope.
-- REVIEW ONLY: additive, no backfill, deletion, or raw catalog data.

alter table public.trackmcp_catalog_versions
  add column if not exists workspace_id uuid references public.trackmcp_workspaces(id) on delete cascade;

create index if not exists trackmcp_catalog_versions_workspace_scope_idx
  on public.trackmcp_catalog_versions (workspace_id, catalog_kind, discovered_at desc);

comment on column public.trackmcp_catalog_versions.workspace_id is
  'Denormalized workspace scope written by the service-role refresh worker; legacy rows may remain null until re-observed.';
