-- Founder OS migration parity postflight (READ ONLY).
-- Run in the authenticated production SQL editor after the application
-- migration ledger exists. This compares the repository manifest below with
-- public.trackmcp_migration_execution and performs no schema or data writes.
-- A missing row is not proof that a migration was not applied through another
-- process; it is an explicit parity gap requiring reviewed evidence.

with expected(migration_version) as (values
  ('20260829000000_trackmcp_telemetry'),
  ('20260829000001_protocol_observability'),
  ('20260829000002_onboarding'),
  ('20260830000003_profile_identity'),
  ('20260906000004_canonical_event_contract'),
  ('20260906000005_session_id_source'),
  ('20260906000006_correlation_handles'),
  ('20260906000007_intent_capability'),
  ('20260907000008_observation_source'),
  ('20260907000009_regressions_alerts'),
  ('20261018000000_submission_attribution'),
  ('20261018000001_cli_device_authorization'),
  ('20261018000002_account_identity_contract'),
  ('20261018000002_cli_activation_hardening'),
  ('20261018000003_cli_activation_reporting'),
  ('20261018000003_founder_os_read_model'),
  ('20261018000004_action_queue_lifecycle'),
  ('20261018000005_catalog_observation_contract'),
  ('20261018000006_founder_os_refresh_jobs'),
  ('20261018000007_privacy_requests'),
  ('20261018000008_catalog_snapshot_versions'),
  ('20261018000009_mcp_round_trip_outcomes'),
  ('20261018000010_refresh_job_worker_rpc'),
  ('20261018000011_catalog_workspace_scope'),
  ('20261018000012_privacy_deletion_batches'),
  ('20261018000013_cli_redemption_idempotency'),
  ('20261018000014_rate_limit_buckets'),
  ('20261019000001_alert_action_queue_link'),
  ('20261019000002_catalog_entity_reads'),
  ('20261019000003_catalog_workspace_unique_scope'),
  ('20261019000004_mcp_mrtr_request_counts'),
  ('20261019000005_task_transition_history'),
  ('20261020000011_prioritize_due_refresh_retries'),
  ('20261020000012_defer_cancelled_refresh_jobs'),
  ('20261021000001_api_key_scopes'),
  ('20261024000001_lifecycle_fact_type'),
  ('20261024000002_api_key_last_used_at'),
  ('20261024000003_privacy_deletion_catalog_entity_reads'),
  ('20261025000001_migration_execution_ledger'),
  ('20261028000001_coalesce_refresh_jobs'),
  ('20261028000002_coalesce_legacy_refresh_backlog'),
  ('20261029000002_account_identity_version'),
  ('20261030000001_catalog_transport_scope'),
  ('20261030000002_task_transition_scope'),
  ('20261030000003_catalog_entity_transport_scope')
), parity as (
  select expected.migration_version,
    ledger.migration_version is not null as recorded,
    ledger.applied_at,
    ledger.release_sha
  from expected
  left join public.trackmcp_migration_execution ledger
    on ledger.migration_version = expected.migration_version
)
select migration_version, recorded, applied_at, release_sha
from parity
order by migration_version;

with expected(migration_version) as (values
  ('20260829000000_trackmcp_telemetry'), ('20260829000001_protocol_observability'),
  ('20260829000002_onboarding'), ('20260830000003_profile_identity'),
  ('20260906000004_canonical_event_contract'), ('20260906000005_session_id_source'),
  ('20260906000006_correlation_handles'), ('20260906000007_intent_capability'),
  ('20260907000008_observation_source'), ('20260907000009_regressions_alerts'),
  ('20261018000000_submission_attribution'), ('20261018000001_cli_device_authorization'),
  ('20261018000002_account_identity_contract'), ('20261018000002_cli_activation_hardening'),
  ('20261018000003_cli_activation_reporting'), ('20261018000003_founder_os_read_model'),
  ('20261018000004_action_queue_lifecycle'), ('20261018000005_catalog_observation_contract'),
  ('20261018000006_founder_os_refresh_jobs'), ('20261018000007_privacy_requests'),
  ('20261018000008_catalog_snapshot_versions'), ('20261018000009_mcp_round_trip_outcomes'),
  ('20261018000010_refresh_job_worker_rpc'), ('20261018000011_catalog_workspace_scope'),
  ('20261018000012_privacy_deletion_batches'), ('20261018000013_cli_redemption_idempotency'),
  ('20261018000014_rate_limit_buckets'), ('20261019000001_alert_action_queue_link'),
  ('20261019000002_catalog_entity_reads'), ('20261019000003_catalog_workspace_unique_scope'),
  ('20261019000004_mcp_mrtr_request_counts'), ('20261019000005_task_transition_history'),
  ('20261020000011_prioritize_due_refresh_retries'), ('20261020000012_defer_cancelled_refresh_jobs'),
  ('20261021000001_api_key_scopes'), ('20261024000001_lifecycle_fact_type'),
  ('20261024000002_api_key_last_used_at'), ('20261024000003_privacy_deletion_catalog_entity_reads'),
  ('20261025000001_migration_execution_ledger'), ('20261028000001_coalesce_refresh_jobs'),
  ('20261028000002_coalesce_legacy_refresh_backlog'),
  ('20261029000002_account_identity_version'),
  ('20261030000001_catalog_transport_scope'),
  ('20261030000002_task_transition_scope'),
  ('20261030000003_catalog_entity_transport_scope')
), summary as (
  select count(*)::bigint as expected_count,
    count(ledger.migration_version)::bigint as recorded_count,
    count(*) filter (where ledger.migration_version is null)::bigint as missing_count
  from expected
  left join public.trackmcp_migration_execution ledger
    on ledger.migration_version = expected.migration_version
)
select *, missing_count = 0 as parity_complete from summary;
