-- Read-only postflight for the Founder OS alert-to-Action-Queue link.
-- Run manually after the reviewed migration, never as a repair script.

select
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'trackmcp_alert_incidents'
      and column_name = 'action_queue_fingerprint'
  ) as column_exists,
  exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and indexname = 'trackmcp_alert_incidents_action_queue_fingerprint_idx'
  ) as index_exists,
  exists (
    select 1
    from pg_constraint
    where conname = 'trackmcp_alert_incidents_action_queue_fingerprint_shape'
  ) as shape_constraint_exists;

select
  count(*) filter (where action_queue_fingerprint is not null) as linked_incident_rows,
  count(*) filter (where action_queue_fingerprint is not null and action_queue_fingerprint !~ '^[0-9a-f]{64}$') as invalid_link_rows
from public.trackmcp_alert_incidents;

select
  count(*) as linked_alert_rows,
  count(q.fingerprint) as matched_queue_rows,
  count(*) - count(q.fingerprint) as unmatched_queue_rows
from public.trackmcp_alert_incidents i
left join public.trackmcp_action_queue q
  on q.workspace_id = i.workspace_id
 and q.fingerprint = i.action_queue_fingerprint
where i.action_queue_fingerprint is not null;

-- Delivery history is evidence only; this query does not expose endpoint URLs,
-- secret references, or delivery payloads.
select
  count(distinct i.id) as linked_incidents_with_delivery_history,
  count(d.id) as bounded_delivery_rows,
  count(d.id) filter (where d.state = 'permanent_failure') as permanent_delivery_failures,
  count(d.id) filter (where d.state = 'retryable_failure') as retryable_delivery_failures
from public.trackmcp_alert_incidents i
left join public.trackmcp_alert_deliveries d
  on d.workspace_id = i.workspace_id
 and d.incident_id = i.id
where i.action_queue_fingerprint is not null;
