-- Keep catalog history separable when the same MCP server is observed over
-- multiple transports. Legacy rows are explicitly labeled unknown rather
-- than having a transport inferred from a session or endpoint.
-- This migration includes an explicit release review for its constraint
-- replacement; the operation is additive and preserves all existing rows.

alter table public.trackmcp_catalog_versions
  add column if not exists transport text not null default 'unknown';

update public.trackmcp_catalog_versions
set transport = 'unknown'
where transport is null or transport = '';

alter table public.trackmcp_catalog_versions
  alter column transport set default 'unknown',
  alter column transport set not null;

alter table public.trackmcp_catalog_versions
  drop constraint if exists trackmcp_catalog_versions_transport_check;

alter table public.trackmcp_catalog_versions
  add constraint trackmcp_catalog_versions_transport_check
  check (transport in ('stdio', 'streamable_http', 'sse', 'custom', 'unknown'));

-- The prior unique scope predated transport. Replace it so an identical
-- catalog hash observed over two transports keeps two honest lineage rows.
alter table public.trackmcp_catalog_versions
  drop constraint if exists trackmcp_catalog_versions_snapshot_hash_idx;

alter table public.trackmcp_catalog_versions
  add constraint trackmcp_catalog_versions_snapshot_hash_idx unique (
    workspace_id,
    server_id,
    environment_id,
    transport,
    catalog_kind,
    snapshot_hash
  );

create index if not exists trackmcp_catalog_versions_transport_scope_idx
  on public.trackmcp_catalog_versions (workspace_id, server_id, environment_id, transport, catalog_kind, discovered_at desc);

comment on column public.trackmcp_catalog_versions.transport is
  'Caller-verified bounded transport label; legacy rows use unknown and no transport is inferred.';
