-- Founder OS audit section 5 (READ ONLY).
-- Every rls_enabled value should be true. Browser SELECT values should be false.
with service_tables(table_name) as (values
  ('trackmcp_workspaces'), ('trackmcp_api_keys'), ('trackmcp_workspace_members'), ('trackmcp_events'),
  ('trackmcp_servers'), ('trackmcp_environments'), ('trackmcp_deployments'), ('trackmcp_catalog_versions'),
  ('trackmcp_alert_destinations'), ('trackmcp_alert_configs'), ('trackmcp_alert_incidents'),
  ('trackmcp_alert_deliveries'), ('trackmcp_alert_evaluation_locks'), ('trackmcp_alert_evaluation_runs'),
  ('trackmcp_cli_device_sessions'), ('trackmcp_activation_milestones'), ('trackmcp_semantic_facts'),
  ('trackmcp_action_queue'), ('trackmcp_refresh_jobs'), ('trackmcp_privacy_requests'),
  ('trackmcp_privacy_deletion_batches')
)
select s.table_name, c.relrowsecurity as rls_enabled,
  has_table_privilege('anon', c.oid, 'select') as anon_can_select,
  has_table_privilege('authenticated', c.oid, 'select') as authenticated_can_select
from service_tables s
left join pg_class c on c.relname = s.table_name
left join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public'
order by s.table_name;
