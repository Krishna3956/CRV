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

-- Actionable source report for the latest form submissions. Explicit UTM and
-- self-reported answers take precedence over the browser-derived bucket;
-- `direct_unknown` means the browser supplied no source evidence, not that
-- the user definitely typed the URL.
select
  coalesce(
    submission_attribution->>'self_reported_source',
    case
      when nullif(submission_attribution->>'utm_source', '') is not null
        then 'campaign:' || lower(submission_attribution->>'utm_source')
      when submission_attribution->>'referrer_hostname' in ('google.com', 'chatgpt.com', 'chat.openai.com')
        then submission_attribution->>'referrer_hostname'
      when nullif(submission_attribution->>'referrer_hostname', '') is not null
        and submission_attribution->>'referrer_hostname' not in ('trackmcp.com', 'app.trackmcp.com', 'localhost')
        then 'referrer:' || submission_attribution->>'referrer_hostname'
      else 'browser_unknown'
    end
  ) as actionable_source,
  count(*) as submissions
from (
  select submission_attribution
  from public.mcp_tools
  where submission_attribution ? 'submission_event_id'
  order by created_at desc
  limit 50
) latest
group by 1
order by submissions desc;

-- Reconcile public-form submissions against bulk-imported directory rows.
-- The raw mcp_tools table also contains imported catalog records, so a plain
-- count(*) is not a people/submission count. Use submission_event_id when it
-- exists; review the remaining rows before reporting a human-submission total.
select
  count(*) filter (where submission_attribution ? 'submission_event_id') as attributed_form_rows,
  count(*) filter (where submission_attribution is null) as rows_without_attribution,
  count(distinct submission_attribution->>'submission_event_id')
    filter (where submission_attribution ? 'submission_event_id') as attributed_submission_events,
  count(distinct submitter_email) as distinct_submitter_values
from public.mcp_tools
where created_at >= now() - interval '90 days';

-- Submission funnel after the application emits the new event names.
-- Run against PostHog/HogQL for the same date window and reconcile the event
-- IDs with the database rows above.

select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'mcp_tools'
order by ordinal_position;
