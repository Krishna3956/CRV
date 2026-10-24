-- TrackMCP Founder OS complete production audit (READ ONLY)
--
-- Revision: 2026-10-19 SQL syntax-corrected audit; use this complete file,
-- rather than an older copied/pasted version of the query.
--
-- Run this entire file in the authenticated Supabase SQL Editor.
-- It checks whether the reviewed Founder OS migrations and their required
-- objects are present. It performs no INSERT, UPDATE, DELETE, TRUNCATE,
-- CREATE, ALTER, DROP, GRANT, or REVOKE operation.
--
-- Interpret the result sets in order:
--   1. migration-ledger portability note
--   2. required table presence
--   3. missing required columns (must return zero rows)
--   4. required indexes and functions (present must be true)
--   5. constraints and RLS/browser privileges
--   6. bounded integrity checks (invalid counts should be zero)

-- 1) Migration-ledger visibility. Supabase does not expose its internal
-- migration ledger consistently to SQL Editor roles, so this check must not
-- reference supabase_migrations.schema_migrations directly. The public-schema
-- object checks below are the authoritative portable postflight checks.
select
  'not_available_to_sql_editor'::text as migration_ledger_status,
  'Use the public-schema checks below; they are safe when the internal ledger is hidden.'::text as note;

-- 2) Required tables. Every row should have exists = true.
with required(table_name) as (values
  ('mcp_tools'), ('trackmcp_profiles'), ('trackmcp_workspaces'),
  ('trackmcp_api_keys'), ('trackmcp_workspace_members'), ('trackmcp_events'),
  ('trackmcp_servers'), ('trackmcp_environments'), ('trackmcp_deployments'),
  ('trackmcp_catalog_versions'), ('trackmcp_alert_destinations'),
  ('trackmcp_alert_configs'), ('trackmcp_alert_incidents'),
  ('trackmcp_alert_deliveries'), ('trackmcp_alert_evaluation_locks'),
  ('trackmcp_alert_evaluation_runs'), ('trackmcp_cli_device_sessions'),
  ('trackmcp_activation_milestones'), ('trackmcp_semantic_facts'),
  ('trackmcp_action_queue'), ('trackmcp_refresh_jobs'),
  ('trackmcp_privacy_requests'), ('trackmcp_privacy_deletion_batches'),
  ('trackmcp_catalog_entity_reads')
)
select table_name, (to_regclass('public.' || table_name) is not null) as exists
from required order by table_name;

-- If any required table is reported as missing, stop here and apply/review
-- that migration before running the remaining statements. Later integrity
-- checks intentionally read the tables directly so they can validate row
-- shape and cannot safely run against an absent relation.

-- 3) Required columns. Zero rows means no required column is missing.
with required(table_name, column_name) as (values
  ('mcp_tools','submission_attribution'),
  ('trackmcp_profiles','user_id'),
  ('trackmcp_workspaces','id'), ('trackmcp_workspaces','name'), ('trackmcp_workspaces','slug'),
  ('trackmcp_api_keys','id'), ('trackmcp_api_keys','workspace_id'), ('trackmcp_api_keys','name'),
  ('trackmcp_api_keys','key_prefix'), ('trackmcp_api_keys','key_hash'), ('trackmcp_api_keys','revoked_at'),
  ('trackmcp_workspace_members','workspace_id'), ('trackmcp_workspace_members','user_id'), ('trackmcp_workspace_members','role'),
  ('trackmcp_events','workspace_id'), ('trackmcp_events','event_id'), ('trackmcp_events','event_type'),
  ('trackmcp_events','service'), ('trackmcp_events','environment'), ('trackmcp_events','started_at'),
  ('trackmcp_events','duration_ms'), ('trackmcp_events','success'), ('trackmcp_events','is_error'),
  ('trackmcp_events','payload'), ('trackmcp_events','received_at'), ('trackmcp_events','server_id'),
  ('trackmcp_events','environment_id'), ('trackmcp_events','deployment_id'), ('trackmcp_events','sdk_version'),
  ('trackmcp_events','transport'), ('trackmcp_events','protocol_version'), ('trackmcp_events','mcp_method'),
  ('trackmcp_events','request_id'), ('trackmcp_events','task_id'), ('trackmcp_events','workflow_id'),
  ('trackmcp_events','account_key'), ('trackmcp_events','account_identity_source'), ('trackmcp_events','catalog_kind'),
  ('trackmcp_events','catalog_item_count'), ('trackmcp_events','catalog_item_name_hashes'),
  ('trackmcp_events','catalog_item_uri_hashes'), ('trackmcp_events','result_type'), ('trackmcp_events','interaction_id'),
  ('trackmcp_events','interaction_link_source'), ('trackmcp_events','retry_of_event_id'),
  ('trackmcp_events','request_state_hash'), ('trackmcp_events','input_response_count'),
  ('trackmcp_events','resource_audience'), ('trackmcp_events','resource_priority'),
  ('trackmcp_servers','workspace_id'), ('trackmcp_servers','name'), ('trackmcp_servers','slug'),
  ('trackmcp_environments','server_id'), ('trackmcp_environments','name'),
  ('trackmcp_deployments','environment_id'), ('trackmcp_deployments','version'), ('trackmcp_deployments','commit_sha'),
  ('trackmcp_catalog_versions','workspace_id'), ('trackmcp_catalog_versions','server_id'),
  ('trackmcp_catalog_versions','environment_id'), ('trackmcp_catalog_versions','catalog_kind'),
  ('trackmcp_catalog_versions','item_count'), ('trackmcp_catalog_versions','item_name_hashes'),
  ('trackmcp_catalog_versions','item_uri_hashes'), ('trackmcp_catalog_versions','snapshot_hash'),
  ('trackmcp_catalog_versions','previous_snapshot_id'), ('trackmcp_catalog_versions','complete'),
  ('trackmcp_catalog_versions','truncated'), ('trackmcp_catalog_versions','observation_source'),
  ('trackmcp_catalog_versions','diff'),
  ('trackmcp_catalog_entity_reads','workspace_id'), ('trackmcp_catalog_entity_reads','source_event_id'),
  ('trackmcp_catalog_entity_reads','server_id'), ('trackmcp_catalog_entity_reads','environment'),
  ('trackmcp_catalog_entity_reads','catalog_kind'), ('trackmcp_catalog_entity_reads','entity_hash'),
  ('trackmcp_catalog_entity_reads','observed_at'), ('trackmcp_catalog_entity_reads','success'),
  ('trackmcp_catalog_entity_reads','is_error'), ('trackmcp_catalog_entity_reads','result_type'),
  ('trackmcp_catalog_entity_reads','created_at'),
  ('trackmcp_cli_device_sessions','device_code_hash'), ('trackmcp_cli_device_sessions','user_code_hash'),
  ('trackmcp_cli_device_sessions','status'), ('trackmcp_cli_device_sessions','expires_at'),
  ('trackmcp_cli_device_sessions','approved_user_id'), ('trackmcp_cli_device_sessions','approved_workspace_id'),
  ('trackmcp_cli_device_sessions','created_key_id'), ('trackmcp_cli_device_sessions','redemption_id_hash'),
  ('trackmcp_activation_milestones','workspace_id'), ('trackmcp_activation_milestones','key_id'),
  ('trackmcp_activation_milestones','first_accepted_at'),
  ('trackmcp_semantic_facts','workspace_id'), ('trackmcp_semantic_facts','source_event_id'),
  ('trackmcp_semantic_facts','fact_version'), ('trackmcp_semantic_facts','semantic'),
  ('trackmcp_semantic_facts','dimensions'), ('trackmcp_semantic_facts','measures'),
  ('trackmcp_action_queue','workspace_id'), ('trackmcp_action_queue','fingerprint'),
  ('trackmcp_action_queue','status'), ('trackmcp_action_queue','severity'), ('trackmcp_action_queue','revision'),
  ('trackmcp_refresh_jobs','workspace_id'), ('trackmcp_refresh_jobs','dedupe_key'),
  ('trackmcp_refresh_jobs','state'), ('trackmcp_refresh_jobs','lease_owner'), ('trackmcp_refresh_jobs','lease_until'),
  ('trackmcp_privacy_requests','requester_user_id'), ('trackmcp_privacy_requests','workspace_id'),
  ('trackmcp_privacy_requests','request_type'), ('trackmcp_privacy_requests','status'),
  ('trackmcp_privacy_requests','idempotency_key'),
  ('trackmcp_privacy_deletion_batches','request_id'), ('trackmcp_privacy_deletion_batches','workspace_id'),
  ('trackmcp_privacy_deletion_batches','dataset'), ('trackmcp_privacy_deletion_batches','batch_number'),
  ('trackmcp_privacy_deletion_batches','after_id'), ('trackmcp_privacy_deletion_batches','status'),
  ('trackmcp_privacy_deletion_batches','dry_run'), ('trackmcp_privacy_deletion_batches','returned_count'),
  ('trackmcp_privacy_deletion_batches','affected_count'), ('trackmcp_privacy_deletion_batches','error_code'),
  ('trackmcp_privacy_deletion_batches','reviewed_by'), ('trackmcp_privacy_deletion_batches','completed_at'),
  ('trackmcp_alert_destinations','workspace_id'), ('trackmcp_alert_destinations','kind'),
  ('trackmcp_alert_destinations','endpoint_url'), ('trackmcp_alert_destinations','secret_ref'),
  ('trackmcp_alert_configs','workspace_id'), ('trackmcp_alert_configs','metric'),
  ('trackmcp_alert_configs','destination_ids'), ('trackmcp_alert_configs','enabled'),
  ('trackmcp_alert_configs','paused'), ('trackmcp_alert_incidents','workspace_id'),
  ('trackmcp_alert_incidents','alert_id'), ('trackmcp_alert_incidents','identity'),
  ('trackmcp_alert_incidents','evaluation_key'), ('trackmcp_alert_incidents','state'),
  ('trackmcp_alert_incidents','severity'), ('trackmcp_alert_incidents','data_status'),
  ('trackmcp_alert_incidents','first_seen_at'), ('trackmcp_alert_incidents','last_seen_at'),
  ('trackmcp_alert_deliveries','workspace_id'), ('trackmcp_alert_deliveries','incident_id'),
  ('trackmcp_alert_deliveries','destination_id'), ('trackmcp_alert_deliveries','idempotency_key'),
  ('trackmcp_alert_deliveries','state'), ('trackmcp_alert_deliveries','attempt_number'),
  ('trackmcp_alert_evaluation_locks','lock_key'), ('trackmcp_alert_evaluation_locks','owner_id'),
  ('trackmcp_alert_evaluation_locks','locked_until'), ('trackmcp_alert_evaluation_runs','lock_key'),
  ('trackmcp_alert_evaluation_runs','evaluation_key'), ('trackmcp_alert_evaluation_runs','state'),
  ('trackmcp_alert_evaluation_runs','started_at')
)
select r.table_name, r.column_name, c.data_type, c.is_nullable
from required r
left join information_schema.columns c
  on c.table_schema = 'public' and c.table_name = r.table_name and c.column_name = r.column_name
where c.column_name is null
order by r.table_name, r.column_name;

-- 4) Required indexes and worker functions. Every present value should be true.
with required(object_name, object_type) as (values
  ('trackmcp_events_workspace_started_idx','index'), ('trackmcp_events_workspace_tool_idx','index'),
  ('trackmcp_events_workspace_session_idx','index'), ('trackmcp_events_workspace_account_started_idx','index'),
  ('trackmcp_events_workspace_interaction_idx','index'), ('trackmcp_catalog_versions_workspace_scope_idx','index'),
  ('trackmcp_catalog_versions_scope_idx','index'), ('trackmcp_catalog_versions_snapshot_hash_idx','index'),
  ('trackmcp_catalog_entity_reads_scope_idx','index'),
  ('trackmcp_catalog_entity_reads_hash_idx','index'), ('trackmcp_cli_device_sessions_expiry_idx','index'),
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

-- 5) Service-only tables: RLS must be enabled and browser SELECT must be false.
with service_tables(table_name) as (values
  ('trackmcp_workspaces'), ('trackmcp_api_keys'), ('trackmcp_workspace_members'), ('trackmcp_events'),
  ('trackmcp_servers'), ('trackmcp_environments'), ('trackmcp_deployments'), ('trackmcp_catalog_versions'),
  ('trackmcp_alert_destinations'), ('trackmcp_alert_configs'), ('trackmcp_alert_incidents'),
  ('trackmcp_alert_deliveries'), ('trackmcp_alert_evaluation_locks'), ('trackmcp_alert_evaluation_runs'),
  ('trackmcp_cli_device_sessions'), ('trackmcp_activation_milestones'), ('trackmcp_semantic_facts'),
  ('trackmcp_action_queue'), ('trackmcp_refresh_jobs'), ('trackmcp_privacy_requests'),
  ('trackmcp_privacy_deletion_batches'), ('trackmcp_catalog_entity_reads')
)
select s.table_name, c.relrowsecurity as rls_enabled,
  has_table_privilege('anon', c.oid, 'select') as anon_can_select,
  has_table_privilege('authenticated', c.oid, 'select') as authenticated_can_select
from service_tables s
left join pg_class c on c.relname = s.table_name
  and c.relnamespace = (select oid from pg_namespace where nspname = 'public')
order by s.table_name;

-- 6) Constraints that enforce the critical bounded/hash contracts.
select conrelid::regclass as table_name, conname, pg_get_constraintdef(oid) as definition
from pg_constraint
where conname in (
  'mcp_tools_submission_attribution_object_check',
  'trackmcp_events_account_identity_source_check',
  'trackmcp_cli_device_sessions_redemption_id_hash_check',
  'trackmcp_privacy_deletion_batches_terminal_timestamps',
  'trackmcp_semantic_facts_fact_type_check'
)
order by table_name, conname;

-- 7) Bounded integrity checks. All invalid_* counts should be zero.
select
  (select count(*) from public.mcp_tools where submission_attribution is not null and jsonb_typeof(submission_attribution) <> 'object')::bigint as invalid_attribution_rows,
  (select count(*) from public.trackmcp_cli_device_sessions where redemption_id_hash is not null and redemption_id_hash !~ '^[a-f0-9]{64}$')::bigint as invalid_redemption_hashes,
  (select count(*) from public.trackmcp_privacy_deletion_batches where returned_count < 0 or returned_count > 500 or affected_count < 0 or affected_count > 500)::bigint as invalid_deletion_batch_counts,
  (select count(*) from public.trackmcp_events where account_key is not null and account_identity_source <> 'resolver')::bigint as invalid_identity_pairs;

-- 8) Entity-read projection must remain hash-only and workspace scoped. This
-- reports malformed rows without exposing URI, prompt, resource, or payload
-- values.
select count(*)::bigint as invalid_catalog_entity_reads
from public.trackmcp_catalog_entity_reads
where entity_hash is null
   or entity_hash !~ '^[a-f0-9]{64}$'
   or catalog_kind is null
   or catalog_kind not in ('resources', 'prompts')
   or source_event_id is null;

-- 9) Bounded row-count snapshot for operator context. This contains counts,
-- not customer payloads, keys, codes, or event contents.
select table_name, row_count
from (
  select 'trackmcp_events'::text as table_name, count(*)::bigint as row_count from public.trackmcp_events
  union all select 'trackmcp_cli_device_sessions', count(*) from public.trackmcp_cli_device_sessions
  union all select 'trackmcp_activation_milestones', count(*) from public.trackmcp_activation_milestones
  union all select 'trackmcp_semantic_facts', count(*) from public.trackmcp_semantic_facts
  union all select 'trackmcp_action_queue', count(*) from public.trackmcp_action_queue
  union all select 'trackmcp_refresh_jobs', count(*) from public.trackmcp_refresh_jobs
  union all select 'trackmcp_privacy_requests', count(*) from public.trackmcp_privacy_requests
  union all select 'trackmcp_privacy_deletion_batches', count(*) from public.trackmcp_privacy_deletion_batches
  union all select 'trackmcp_catalog_entity_reads', count(*) from public.trackmcp_catalog_entity_reads
) counts
order by table_name;
