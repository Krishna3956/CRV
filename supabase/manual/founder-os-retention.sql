-- Founder OS retention dry-run and operator cleanup.
-- SAFE BY DEFAULT: the first query only reports candidates. Do not remove the
-- comment markers from the DELETE block until the report has been reviewed.
-- Policy version: v1 (raw 90d, facts 365d, action queue 180d, diagnostics 30d).

-- Dry-run report. This is read-only and safe to execute repeatedly.
select 'trackmcp_events' as dataset, count(*) as rows_eligible,
       min(started_at) as oldest_eligible
from public.trackmcp_events
where started_at < now() - interval '90 days'
union all
select 'trackmcp_semantic_facts', count(*), min(observed_at)
from public.trackmcp_semantic_facts
where observed_at < now() - interval '365 days'
union all
select 'trackmcp_action_queue', count(*), min(last_seen_at)
from public.trackmcp_action_queue
where last_seen_at < now() - interval '180 days';

-- Optional diagnostics are not part of the read-model migration. If that table
-- exists, run this separate read-only query; otherwise skip it:
-- select count(*) as rows_eligible, min(created_at) as oldest_eligible
-- from public.trackmcp_diagnostics
-- where created_at < now() - interval '30 days';

-- Destructive block: execute only after reviewing the dry-run result. Prefer a
-- transaction and retain the operator/timestamp/report as an audit record.
-- begin;
-- delete from public.trackmcp_events
-- where started_at < now() - interval '90 days';
-- delete from public.trackmcp_semantic_facts
-- where observed_at < now() - interval '365 days';
-- delete from public.trackmcp_action_queue
-- where last_seen_at < now() - interval '180 days';
-- delete from public.trackmcp_diagnostics
-- where created_at < now() - interval '30 days';
-- commit;

