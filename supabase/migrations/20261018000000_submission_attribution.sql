-- Durable, privacy-minimized acquisition context for directory submissions.
-- Existing rows remain NULL; this migration intentionally performs no backfill.
alter table public.mcp_tools
  add column if not exists submission_attribution jsonb;

comment on column public.mcp_tools.submission_attribution is
  'Bounded first/last-touch source context; contains no IP, fingerprint, email, cookie, or full referrer URL.';

alter table public.mcp_tools
  drop constraint if exists mcp_tools_submission_attribution_object_check;

alter table public.mcp_tools
  add constraint mcp_tools_submission_attribution_object_check
  check (submission_attribution is null or jsonb_typeof(submission_attribution) = 'object');
