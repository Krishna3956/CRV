-- Read-only postflight for 20261018000014_rate_limit_buckets.sql.
select
  to_regclass('public.trackmcp_rate_limit_buckets') is not null as table_exists,
  coalesce((select c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname = 'trackmcp_rate_limit_buckets'), false) as rls_enabled,
  to_regclass('public.trackmcp_rate_limit_buckets_updated_idx') is not null as updated_index_exists,
  to_regprocedure('public.trackmcp_consume_rate_limit(text,integer,integer)') is not null as function_exists,
  to_regprocedure('public.trackmcp_cleanup_rate_limit_buckets(integer,integer)') is not null as cleanup_function_exists,
  has_table_privilege('anon', 'public.trackmcp_rate_limit_buckets', 'select') as anon_can_select,
  has_table_privilege('authenticated', 'public.trackmcp_rate_limit_buckets', 'select') as authenticated_can_select,
  has_function_privilege('anon', 'public.trackmcp_consume_rate_limit(text,integer,integer)', 'execute') as anon_can_execute,
  has_function_privilege('authenticated', 'public.trackmcp_consume_rate_limit(text,integer,integer)', 'execute') as authenticated_can_execute,
  has_function_privilege('service_role', 'public.trackmcp_consume_rate_limit(text,integer,integer)', 'execute') as service_role_can_execute,
  has_function_privilege('anon', 'public.trackmcp_cleanup_rate_limit_buckets(integer,integer)', 'execute') as anon_can_cleanup,
  has_function_privilege('authenticated', 'public.trackmcp_cleanup_rate_limit_buckets(integer,integer)', 'execute') as authenticated_can_cleanup,
  has_function_privilege('service_role', 'public.trackmcp_cleanup_rate_limit_buckets(integer,integer)', 'execute') as service_role_can_cleanup;
