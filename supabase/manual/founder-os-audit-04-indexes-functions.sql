-- Founder OS audit section 4 (READ ONLY).
-- Every present value should be true.
with required(object_name, object_type) as (values
  ('trackmcp_events_workspace_started_idx','index'), ('trackmcp_events_workspace_tool_idx','index'),
  ('trackmcp_events_workspace_session_idx','index'), ('trackmcp_events_workspace_account_started_idx','index'),
  ('trackmcp_events_workspace_interaction_idx','index'), ('trackmcp_catalog_versions_workspace_scope_idx','index'),
  ('trackmcp_catalog_versions_scope_idx','index'), ('trackmcp_cli_device_sessions_expiry_idx','index'),
  ('trackmcp_cli_device_sessions_redemption_id_idx','index'), ('trackmcp_activation_milestones_workspace_first_idx','index'),
  ('trackmcp_semantic_facts_workspace_observed_idx','index'), ('trackmcp_action_queue_workspace_status_idx','index'),
  ('trackmcp_refresh_jobs_due_idx','index'), ('trackmcp_refresh_jobs_lease_idx','index'),
  ('trackmcp_privacy_requests_workspace_status_idx','index'), ('trackmcp_privacy_requests_review_queue_idx','index'),
  ('trackmcp_privacy_deletion_batches_request_idx','index'), ('trackmcp_privacy_deletion_batches_processing_idx','index'),
  ('trackmcp_alert_destinations_workspace_enabled_idx','index'),
  ('trackmcp_alert_configs_workspace_enabled_idx','index'),
  ('trackmcp_alert_incidents_workspace_state_seen_idx','index'),
  ('trackmcp_alert_deliveries_retry_idx','index'),
  ('trackmcp_alert_evaluation_runs_started_idx','index')
)
select object_name, object_type,
  exists (select 1 from pg_indexes i where i.schemaname = 'public' and i.indexname = object_name) as present
from required
union all select 'public.trackmcp_claim_refresh_job(text,integer)', 'function', to_regprocedure('public.trackmcp_claim_refresh_job(text,integer)') is not null
union all select 'public.trackmcp_record_refresh_job_result(uuid,text,text,text,text)', 'function', to_regprocedure('public.trackmcp_record_refresh_job_result(uuid,text,text,text,text)') is not null
union all select 'public.trackmcp_claim_alert_evaluation(text,text,timestamptz,timestamptz)', 'function', to_regprocedure('public.trackmcp_claim_alert_evaluation(text,text,timestamptz,timestamptz)') is not null
union all select 'public.trackmcp_release_alert_evaluation(text,text,timestamptz)', 'function', to_regprocedure('public.trackmcp_release_alert_evaluation(text,text,timestamptz)') is not null
order by object_type, object_name;
