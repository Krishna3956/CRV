-- Read-only postflight for 20261018000005_catalog_observation_contract.sql.
select
  to_regclass('public.trackmcp_events') as events_table,
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'trackmcp_events' and column_name = 'catalog_kind'
  ) as has_catalog_kind,
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'trackmcp_events' and column_name = 'catalog_item_name_hashes'
  ) as has_name_hashes,
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'trackmcp_events' and column_name = 'catalog_item_uri_hashes'
  ) as has_uri_hashes;

select
  count(*) filter (where catalog_kind is not null) as catalog_events,
  count(*) filter (where catalog_item_count is not null) as events_with_item_counts,
  coalesce(max(jsonb_array_length(catalog_item_name_hashes)), 0) as max_name_hashes,
  coalesce(max(jsonb_array_length(catalog_item_uri_hashes)), 0) as max_uri_hashes
from public.trackmcp_events;
