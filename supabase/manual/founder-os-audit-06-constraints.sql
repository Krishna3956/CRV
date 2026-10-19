-- Founder OS audit section 6 (READ ONLY).
-- The listed constraints should be present.
select conrelid::regclass as table_name, conname, pg_get_constraintdef(oid) as definition
from pg_constraint
where conname in (
  'mcp_tools_submission_attribution_object_check',
  'trackmcp_events_account_identity_source_check',
  'trackmcp_cli_device_sessions_redemption_id_hash_check',
  'trackmcp_privacy_deletion_batches_terminal_timestamps'
)
order by table_name, conname;
