-- Founder OS catalog observation contract.
-- Review-only: additive, no backfill, trigger, deletion, or raw identifier storage.

alter table public.trackmcp_events
  add column if not exists catalog_kind text,
  add column if not exists catalog_item_count integer,
  add column if not exists catalog_item_name_hashes jsonb not null default '[]'::jsonb,
  add column if not exists catalog_item_uri_hashes jsonb not null default '[]'::jsonb;

alter table public.trackmcp_events
  drop constraint if exists trackmcp_events_catalog_kind_check,
  drop constraint if exists trackmcp_events_catalog_item_count_check,
  drop constraint if exists trackmcp_events_catalog_item_name_hashes_check,
  drop constraint if exists trackmcp_events_catalog_item_uri_hashes_check;

alter table public.trackmcp_events
  add constraint trackmcp_events_catalog_kind_check
    check (catalog_kind is null or catalog_kind in ('tools', 'resources', 'resource_templates', 'prompts')),
  add constraint trackmcp_events_catalog_item_count_check
    check (catalog_item_count is null or catalog_item_count between 0 and 1000000),
  add constraint trackmcp_events_catalog_item_name_hashes_check
    check (jsonb_typeof(catalog_item_name_hashes) = 'array' and jsonb_array_length(catalog_item_name_hashes) <= 128),
  add constraint trackmcp_events_catalog_item_uri_hashes_check
    check (jsonb_typeof(catalog_item_uri_hashes) = 'array' and jsonb_array_length(catalog_item_uri_hashes) <= 128),
  add constraint trackmcp_events_catalog_hashes_size_check
    check (pg_column_size(catalog_item_name_hashes) <= 16384 and pg_column_size(catalog_item_uri_hashes) <= 16384);

comment on column public.trackmcp_events.catalog_item_name_hashes is
  'Bounded SHA-256 hashes of catalog item names; raw names are never stored.';
comment on column public.trackmcp_events.catalog_item_uri_hashes is
  'Bounded SHA-256 hashes of catalog URI identifiers; raw URIs are never stored.';
