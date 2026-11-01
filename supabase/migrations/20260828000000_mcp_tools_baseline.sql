-- Baseline directory table required by the application-owned migrations.
-- The source Supabase project predates this repository's tracked migrations;
-- keep this definition compatible with the existing public mcp_tools table.
create extension if not exists pgcrypto;

create table if not exists public.mcp_tools (
  id uuid primary key default gen_random_uuid(),
  repo_name text,
  description text,
  github_url text not null,
  stars integer,
  language text,
  topics text[] default '{}'::text[],
  status text default 'pending'::text,
  last_updated timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  is_valid boolean default true,
  category text default 'Others'::text,
  meta_description text,
  submitter_email varchar not null default ''::varchar,
  wants_featured boolean default false,
  submission_attribution jsonb
);

create unique index if not exists mcp_tools_github_url_unique
  on public.mcp_tools (github_url);
create index if not exists idx_mcp_tools_category
  on public.mcp_tools (category);
create index if not exists idx_mcp_tools_is_valid
  on public.mcp_tools (is_valid);
create index if not exists idx_mcp_tools_repo_name
  on public.mcp_tools (repo_name);
create index if not exists idx_mcp_tools_status
  on public.mcp_tools (status);

alter table public.mcp_tools
  drop constraint if exists mcp_tools_submission_attribution_object_check;
alter table public.mcp_tools
  add constraint mcp_tools_submission_attribution_object_check
  check (submission_attribution is null or jsonb_typeof(submission_attribution) = 'object');

alter table public.mcp_tools disable row level security;
grant select on public.mcp_tools to anon;
grant select on public.mcp_tools to authenticated;
grant select on public.mcp_tools to service_role;
