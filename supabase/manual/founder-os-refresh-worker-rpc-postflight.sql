-- Founder OS refresh-worker RPC postflight (READ ONLY).
select
  routine_name,
  routine_schema,
  security_type,
  has_function_privilege('service_role', routine_schema || '.' || routine_name || '(text,integer)', 'EXECUTE') as service_role_can_claim,
  has_function_privilege('authenticated', routine_schema || '.' || routine_name || '(text,integer)', 'EXECUTE') as authenticated_can_claim
from information_schema.routines
where routine_schema = 'public'
  and routine_name = 'trackmcp_claim_refresh_job'
union all
select
  routine_name,
  routine_schema,
  security_type,
  has_function_privilege('service_role', routine_schema || '.' || routine_name || '(uuid,text,text,text,text)', 'EXECUTE') as service_role_can_claim,
  has_function_privilege('authenticated', routine_schema || '.' || routine_name || '(uuid,text,text,text,text)', 'EXECUTE') as authenticated_can_claim
from information_schema.routines
where routine_schema = 'public'
  and routine_name = 'trackmcp_record_refresh_job_result';
