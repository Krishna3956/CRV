-- Preserve the caller-verified transport on durable hash-only resource/prompt
-- reads. Existing rows remain null and are projected as unknown.
alter table public.trackmcp_catalog_entity_reads
  add column if not exists transport text;

alter table public.trackmcp_catalog_entity_reads
  add constraint trackmcp_catalog_entity_reads_transport_check
  check (transport is null or transport in ('stdio', 'streamable_http', 'sse', 'custom', 'unknown'));

create index if not exists trackmcp_catalog_entity_reads_transport_scope_idx
  on public.trackmcp_catalog_entity_reads (workspace_id, catalog_kind, transport, observed_at desc);

comment on column public.trackmcp_catalog_entity_reads.transport is
  'Caller-verified transport label; null denotes legacy entity-read evidence.';
