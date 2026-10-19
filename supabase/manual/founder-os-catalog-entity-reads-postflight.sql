-- Read-only production postflight for the catalog entity read projection.
select
  to_regclass('public.trackmcp_catalog_entity_reads') is not null as table_exists,
  to_regclass('public.trackmcp_catalog_entity_reads_scope_idx') is not null as scope_index_exists,
  to_regclass('public.trackmcp_catalog_entity_reads_hash_idx') is not null as hash_index_exists;

select
  count(*) filter (where catalog_kind not in ('resources', 'prompts')) as invalid_kinds,
  count(*) filter (where entity_hash !~ '^[0-9a-f]{64}$') as invalid_hashes,
  count(*) filter (where char_length(source_event_id) = 0) as invalid_event_ids
from public.trackmcp_catalog_entity_reads;

select
  count(*) as projected_reads,
  count(*) filter (where catalog_kind = 'resources') as resource_reads,
  count(*) filter (where catalog_kind = 'prompts') as prompt_reads,
  count(*) filter (where success is true and is_error is not true) as successful_reads,
  count(*) filter (where is_error is true or success is false) as failed_reads
from public.trackmcp_catalog_entity_reads;
