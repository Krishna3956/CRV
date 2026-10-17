-- Historical coverage and future source report. Run read-only in Supabase SQL Editor.
select min(created_at) as first_submission, max(created_at) as last_submission, count(*) as total_submissions
from public.mcp_tools;

select
  count(*) filter (where created_at >= now() - interval '30 days') as last_30_days,
  count(*) filter (where created_at >= now() - interval '90 days') as last_90_days
from public.mcp_tools;

select
  coalesce(submission_attribution->>'source_class', 'unattributed') as source_class,
  count(*) as submissions
from public.mcp_tools
where created_at >= now() - interval '90 days'
group by 1
order by submissions desc;

select
  case when created_at >= now() - interval '30 days' then '30d' else '90d' end as window,
  coalesce(submission_attribution->>'source_class', 'unattributed') as source_class,
  count(*) as submissions
from public.mcp_tools
where created_at >= now() - interval '90 days'
group by 1, 2
order by 1, 3 desc;

select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'mcp_tools'
order by ordinal_position;
