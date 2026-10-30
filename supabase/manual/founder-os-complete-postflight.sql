-- Founder OS complete schema postflight (READ ONLY).
-- Run this in the authenticated Supabase SQL editor after the migrations.
-- It does not create, alter, delete, or update anything.

-- 1) Required tables: one row per table, with a boolean that is easy to scan.
with required(table_name) as (
  values
    ('trackmcp_workspaces'),
    ('trackmcp_api_keys'),
    ('trackmcp_workspace_members'),
    ('trackmcp_events'),
    ('trackmcp_servers'),
    ('trackmcp_environments'),
    ('trackmcp_deployments'),
    ('trackmcp_catalog_versions'),
    ('trackmcp_catalog_entity_reads'),
    ('trackmcp_cli_device_sessions'),
    ('trackmcp_activation_milestones'),
    ('trackmcp_semantic_facts'),
    ('trackmcp_action_queue'),
    ('trackmcp_refresh_jobs'),
    ('trackmcp_privacy_requests'),
    ('trackmcp_rate_limit_buckets')
)
select
  r.table_name,
  (to_regclass('public.' || r.table_name) is not null) as exists
from required r
order by r.table_name;

-- 2) Required columns. Any row with exists = false is missing from production.
with required(table_name, column_name) as (
  values
    ('trackmcp_workspaces', 'id'),
    ('trackmcp_workspaces', 'name'),
    ('trackmcp_workspaces', 'slug'),
    ('trackmcp_api_keys', 'workspace_id'),
    ('trackmcp_api_keys', 'name'),
    ('trackmcp_api_keys', 'key_prefix'),
    ('trackmcp_api_keys', 'key_hash'),
    ('trackmcp_api_keys', 'revoked_at'),
    ('trackmcp_workspace_members', 'workspace_id'),
    ('trackmcp_workspace_members', 'user_id'),
    ('trackmcp_workspace_members', 'role'),
    ('trackmcp_events', 'workspace_id'),
    ('trackmcp_events', 'event_id'),
    ('trackmcp_events', 'event_type'),
    ('trackmcp_events', 'service'),
    ('trackmcp_events', 'environment'),
    ('trackmcp_events', 'started_at'),
    ('trackmcp_events', 'duration_ms'),
    ('trackmcp_events', 'success'),
    ('trackmcp_events', 'is_error'),
    ('trackmcp_events', 'payload'),
    ('trackmcp_events', 'received_at'),
    ('trackmcp_events', 'server_id'),
    ('trackmcp_events', 'environment_id'),
    ('trackmcp_events', 'deployment_id'),
    ('trackmcp_events', 'sdk_version'),
    ('trackmcp_events', 'transport'),
    ('trackmcp_events', 'protocol_version'),
    ('trackmcp_events', 'mcp_method'),
    ('trackmcp_events', 'request_id'),
    ('trackmcp_events', 'task_id'),
    ('trackmcp_events', 'workflow_id'),
    ('trackmcp_events', 'account_key'),
    ('trackmcp_events', 'account_identity_source'),
    ('trackmcp_events', 'account_identity_version'),
    ('trackmcp_events', 'catalog_kind'),
    ('trackmcp_events', 'catalog_item_count'),
    ('trackmcp_events', 'catalog_item_name_hashes'),
    ('trackmcp_events', 'catalog_item_uri_hashes'),
    ('trackmcp_events', 'result_type'),
    ('trackmcp_events', 'interaction_id'),
    ('trackmcp_events', 'interaction_link_source'),
    ('trackmcp_events', 'retry_of_event_id'),
    ('trackmcp_events', 'request_state_hash'),
    ('trackmcp_events', 'input_response_count'),
    ('trackmcp_events', 'resource_audience'),
    ('trackmcp_events', 'resource_priority'),
    ('trackmcp_servers', 'workspace_id'),
    ('trackmcp_servers', 'name'),
    ('trackmcp_servers', 'slug'),
    ('trackmcp_environments', 'server_id'),
    ('trackmcp_environments', 'name'),
    ('trackmcp_deployments', 'environment_id'),
    ('trackmcp_deployments', 'version'),
    ('trackmcp_deployments', 'commit_sha'),
    ('trackmcp_catalog_versions', 'server_id'),
    ('trackmcp_catalog_versions', 'workspace_id'),
    ('trackmcp_catalog_versions', 'environment_id'),
    ('trackmcp_catalog_versions', 'transport'),
    ('trackmcp_catalog_versions', 'catalog_kind'),
    ('trackmcp_catalog_versions', 'item_count'),
    ('trackmcp_catalog_versions', 'item_name_hashes'),
    ('trackmcp_catalog_versions', 'item_uri_hashes'),
    ('trackmcp_catalog_versions', 'snapshot_hash'),
    ('trackmcp_catalog_versions', 'previous_snapshot_id'),
    ('trackmcp_catalog_versions', 'complete'),
    ('trackmcp_catalog_versions', 'truncated'),
    ('trackmcp_catalog_versions', 'observation_source'),
    ('trackmcp_catalog_versions', 'diff'),
    ('trackmcp_catalog_entity_reads', 'workspace_id'),
    ('trackmcp_catalog_entity_reads', 'source_event_id'),
    ('trackmcp_catalog_entity_reads', 'catalog_kind'),
    ('trackmcp_catalog_entity_reads', 'entity_hash'),
    ('trackmcp_catalog_entity_reads', 'transport'),
    ('trackmcp_catalog_entity_reads', 'observed_at'),
    ('trackmcp_cli_device_sessions', 'device_code_hash'),
    ('trackmcp_cli_device_sessions', 'user_code_hash'),
    ('trackmcp_cli_device_sessions', 'status'),
    ('trackmcp_cli_device_sessions', 'expires_at'),
    ('trackmcp_cli_device_sessions', 'approved_user_id'),
    ('trackmcp_cli_device_sessions', 'approved_workspace_id'),
    ('trackmcp_cli_device_sessions', 'created_key_id'),
    ('trackmcp_activation_milestones', 'workspace_id'),
    ('trackmcp_activation_milestones', 'key_id'),
    ('trackmcp_activation_milestones', 'first_accepted_at'),
    ('trackmcp_semantic_facts', 'workspace_id'),
    ('trackmcp_semantic_facts', 'source_event_id'),
    ('trackmcp_semantic_facts', 'fact_version'),
    ('trackmcp_semantic_facts', 'semantic'),
    ('trackmcp_semantic_facts', 'dimensions'),
    ('trackmcp_semantic_facts', 'measures'),
    ('trackmcp_action_queue', 'workspace_id'),
    ('trackmcp_action_queue', 'fingerprint'),
    ('trackmcp_action_queue', 'status'),
    ('trackmcp_action_queue', 'severity'),
    ('trackmcp_action_queue', 'revision'),
    ('trackmcp_refresh_jobs', 'workspace_id'),
    ('trackmcp_refresh_jobs', 'dedupe_key'),
    ('trackmcp_refresh_jobs', 'state'),
    ('trackmcp_refresh_jobs', 'lease_owner'),
    ('trackmcp_refresh_jobs', 'lease_until'),
    ('trackmcp_refresh_jobs', 'request_revision'),
    ('trackmcp_refresh_jobs', 'lease_revision'),
    ('trackmcp_privacy_requests', 'requester_user_id'),
    ('trackmcp_privacy_requests', 'workspace_id'),
    ('trackmcp_privacy_requests', 'request_type'),
    ('trackmcp_privacy_requests', 'status'),
    ('trackmcp_privacy_requests', 'idempotency_key')
    ,('trackmcp_rate_limit_buckets', 'bucket_key')
    ,('trackmcp_rate_limit_buckets', 'window_started_at')
    ,('trackmcp_rate_limit_buckets', 'request_count')
    ,('trackmcp_rate_limit_buckets', 'updated_at')
)
select
  r.table_name,
  r.column_name,
  (c.column_name is not null) as exists,
  c.data_type,
  c.is_nullable
from required r
left join information_schema.columns c
  on c.table_schema = 'public'
 and c.table_name = r.table_name
 and c.column_name = r.column_name
order by r.table_name, r.column_name;

-- 3) Required indexes and constraints.
with required(object_name, object_type) as (
  values
    ('trackmcp_events_workspace_started_idx', 'index'),
    ('trackmcp_events_workspace_tool_idx', 'index'),
    ('trackmcp_events_workspace_session_idx', 'index'),
    ('trackmcp_events_workspace_account_started_idx', 'index'),
    ('trackmcp_events_workspace_interaction_idx', 'index'),
    ('trackmcp_cli_device_sessions_expiry_idx', 'index'),
    ('trackmcp_activation_milestones_workspace_first_idx', 'index'),
    ('trackmcp_semantic_facts_workspace_observed_idx', 'index'),
    ('trackmcp_action_queue_workspace_status_idx', 'index'),
    ('trackmcp_refresh_jobs_due_idx', 'index'),
    ('trackmcp_privacy_requests_review_queue_idx', 'index'),
    ('trackmcp_catalog_versions_workspace_scope_idx', 'index'),
    ('trackmcp_catalog_versions_scope_idx', 'index'),
    ('trackmcp_catalog_versions_snapshot_hash_idx', 'index'),
    ('trackmcp_catalog_versions_transport_scope_idx', 'index'),
    ('trackmcp_catalog_entity_reads_scope_idx', 'index'),
    ('trackmcp_catalog_entity_reads_hash_idx', 'index'),
    ('trackmcp_events_result_type_check', 'constraint'),
    ('trackmcp_events_request_state_hash_check', 'constraint'),
    ('trackmcp_events_resource_priority_check', 'constraint'),
    ('trackmcp_semantic_facts_fact_type_check', 'constraint'),
    ('trackmcp_cli_device_sessions_approval_check', 'constraint'),
    ('trackmcp_action_queue_revision_positive', 'constraint')
    ,('trackmcp_rate_limit_buckets_updated_idx', 'index')
)
select r.object_name, r.object_type,
  case when r.object_type = 'index' then exists (
    select 1 from pg_indexes i where i.schemaname = 'public' and i.indexname = r.object_name
  ) else exists (
    select 1 from pg_constraint c where c.conname = r.object_name
  ) end as exists
from required r
order by r.object_type, r.object_name;

-- 4) Service-only tables must have RLS enabled and no direct browser grants.
select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  has_table_privilege('anon', c.oid, 'select') as anon_can_select,
  has_table_privilege('authenticated', c.oid, 'select') as authenticated_can_select
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'trackmcp_workspaces',
    'trackmcp_api_keys',
    'trackmcp_workspace_members',
    'trackmcp_events',
    'trackmcp_servers',
    'trackmcp_environments',
    'trackmcp_deployments',
    'trackmcp_catalog_versions',
    'trackmcp_catalog_entity_reads',
    'trackmcp_cli_device_sessions',
    'trackmcp_activation_milestones',
    'trackmcp_semantic_facts',
    'trackmcp_action_queue',
    'trackmcp_refresh_jobs',
    'trackmcp_privacy_requests',
    'trackmcp_rate_limit_buckets'
  )
order by c.relname;

-- 5) Worker RPCs must exist and be executable only by service_role.
with required(signature) as (
  values
    ('public.trackmcp_enqueue_refresh_jobs(uuid,bigint,timestamptz)'),
    ('public.trackmcp_claim_refresh_job(text,integer)'),
    ('public.trackmcp_record_refresh_job_result(uuid,text,text,text,text)')
    ,('public.trackmcp_consume_rate_limit(text,integer,integer)')
    ,('public.trackmcp_cleanup_rate_limit_buckets(integer,integer)')
)
select
  signature,
  to_regprocedure(signature) is not null as exists,
  case when to_regprocedure(signature) is null then null
    else has_function_privilege('service_role', to_regprocedure(signature), 'execute') end as service_role_can_execute,
  case when to_regprocedure(signature) is null then null
    else has_function_privilege('anon', to_regprocedure(signature), 'execute') end as anon_can_execute,
  case when to_regprocedure(signature) is null then null
    else has_function_privilege('authenticated', to_regprocedure(signature), 'execute') end as authenticated_can_execute
from required
order by signature;

-- Migration history is intentionally not queried here because Supabase's
-- internal migration table is not guaranteed to be exposed to SQL Editor.
-- The table/column/constraint checks above are the authoritative result.
