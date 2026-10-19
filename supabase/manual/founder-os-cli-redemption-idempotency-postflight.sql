-- Read-only postflight for 20261018000013_cli_redemption_idempotency.sql.
select
  c.column_name,
  c.data_type,
  c.is_nullable,
  (i.indexname is not null) as redemption_index_present
from information_schema.columns c
left join pg_indexes i
  on i.schemaname = 'public'
 and i.indexname = 'trackmcp_cli_device_sessions_redemption_id_idx'
where c.table_schema = 'public'
  and c.table_name = 'trackmcp_cli_device_sessions'
  and c.column_name = 'redemption_id_hash';

select count(*)::bigint as malformed_redemption_hashes
from public.trackmcp_cli_device_sessions
where redemption_id_hash is not null
  and redemption_id_hash !~ '^[a-f0-9]{64}$';
