-- Auditable operator history for individual directory listing corrections.
-- The operator route is the only intended writer for this table.
create table if not exists public.mcp_tool_listing_audits (
  id uuid primary key default gen_random_uuid(),
  tool_id uuid not null references public.mcp_tools(id) on delete restrict,
  actor text not null,
  action text not null,
  reason text not null,
  before_data jsonb not null,
  after_data jsonb not null,
  created_at timestamptz not null default now(),
  constraint mcp_tool_listing_audits_data_object_check
    check (jsonb_typeof(before_data) = 'object' and jsonb_typeof(after_data) = 'object')
);

create index if not exists idx_mcp_tool_listing_audits_tool_created
  on public.mcp_tool_listing_audits (tool_id, created_at desc);

revoke all on public.mcp_tool_listing_audits from public, anon, authenticated;
grant select, insert on public.mcp_tool_listing_audits to service_role;
