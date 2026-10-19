-- Founder OS catalog snapshot/version contract.
-- REVIEW ONLY: additive, privacy-safe, and intentionally not executable by the app.
-- New snapshot rows must use bounded SHA-256 hashes; the legacy `catalog` column
-- remains for compatibility but is not read by the Founder OS v2 contract.

alter table public.trackmcp_catalog_versions
  add column if not exists catalog_kind text,
  add column if not exists item_count integer,
  add column if not exists item_name_hashes jsonb not null default '[]'::jsonb,
  add column if not exists item_uri_hashes jsonb not null default '[]'::jsonb,
  add column if not exists snapshot_hash text,
  add column if not exists previous_snapshot_id uuid,
  add column if not exists complete boolean not null default false,
  add column if not exists truncated boolean not null default false,
  add column if not exists observation_source text not null default 'sdk_event',
  add column if not exists diff jsonb not null default '{}'::jsonb;

alter table public.trackmcp_catalog_versions
  drop constraint if exists trackmcp_catalog_versions_kind_check,
  drop constraint if exists trackmcp_catalog_versions_item_count_check,
  drop constraint if exists trackmcp_catalog_versions_name_hashes_check,
  drop constraint if exists trackmcp_catalog_versions_uri_hashes_check,
  drop constraint if exists trackmcp_catalog_versions_snapshot_hash_check,
  drop constraint if exists trackmcp_catalog_versions_source_check,
  drop constraint if exists trackmcp_catalog_versions_diff_size_check;

alter table public.trackmcp_catalog_versions
  add constraint trackmcp_catalog_versions_kind_check check (catalog_kind is null or catalog_kind in ('tools', 'resources', 'resource_templates', 'prompts')),
  add constraint trackmcp_catalog_versions_item_count_check check (item_count is null or item_count between 0 and 1000000),
  add constraint trackmcp_catalog_versions_name_hashes_check check (jsonb_typeof(item_name_hashes) = 'array' and jsonb_array_length(item_name_hashes) <= 128),
  add constraint trackmcp_catalog_versions_uri_hashes_check check (jsonb_typeof(item_uri_hashes) = 'array' and jsonb_array_length(item_uri_hashes) <= 128),
  add constraint trackmcp_catalog_versions_snapshot_hash_check check (snapshot_hash is null or snapshot_hash ~ '^[0-9a-fA-F]{64}$'),
  add constraint trackmcp_catalog_versions_source_check check (observation_source in ('sdk_event', 'tester', 'imported', 'worker')),
  add constraint trackmcp_catalog_versions_diff_size_check check (pg_column_size(diff) <= 8192);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'trackmcp_catalog_versions_previous_fk'
      and conrelid = 'public.trackmcp_catalog_versions'::regclass
  ) then
    alter table public.trackmcp_catalog_versions
      add constraint trackmcp_catalog_versions_previous_fk
      foreign key (previous_snapshot_id) references public.trackmcp_catalog_versions(id) on delete set null;
  end if;
end
$$;

create index if not exists trackmcp_catalog_versions_scope_idx
  on public.trackmcp_catalog_versions (server_id, environment_id, catalog_kind, discovered_at desc);
create unique index if not exists trackmcp_catalog_versions_snapshot_hash_idx
  on public.trackmcp_catalog_versions (server_id, environment_id, catalog_kind, snapshot_hash)
  where snapshot_hash is not null;

comment on column public.trackmcp_catalog_versions.item_name_hashes is 'Bounded SHA-256 name hashes only; raw catalog item names are not part of the Founder OS v2 contract.';
comment on column public.trackmcp_catalog_versions.item_uri_hashes is 'Bounded SHA-256 URI hashes only; raw resource URIs are not part of the Founder OS v2 contract.';
comment on column public.trackmcp_catalog_versions.diff is 'Bounded hash/count diff metadata; never raw catalog entries or arguments.';
