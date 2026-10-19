-- Read-only postflight for 20261018000007_privacy_requests.sql.
select
  to_regclass('public.trackmcp_privacy_requests') as privacy_requests_table,
  (select count(*) from pg_policies where schemaname = 'public' and tablename = 'trackmcp_privacy_requests') as policy_count,
  has_table_privilege('anon', 'public.trackmcp_privacy_requests', 'select') as anon_can_select,
  has_table_privilege('authenticated', 'public.trackmcp_privacy_requests', 'select') as authenticated_can_select;

select status, count(*)
from public.trackmcp_privacy_requests
group by status
order by status;
