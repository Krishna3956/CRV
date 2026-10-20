-- Founder OS refresh worker cancellation boundary.
-- REVIEW ONLY: additive function replacement; apply after reviewing the worker code.
-- A bounded deadline may stop before a claimed job finishes. Requeue that job
-- immediately instead of turning scheduler cancellation into a retryable failure.

create or replace function public.trackmcp_record_refresh_job_result(
  p_id uuid,
  p_owner text,
  p_outcome text,
  p_error_code text default null,
  p_error_detail text default null
)
returns setof public.trackmcp_refresh_jobs
language sql
security definer
set search_path = public
as $$
  update public.trackmcp_refresh_jobs
  set state = case
        when p_outcome = 'succeeded' then 'succeeded'
        when p_outcome = 'deferred' then 'queued'
        when p_outcome = 'failed' or attempt_count >= max_attempts then 'failed'
        else 'retryable'
      end,
      available_at = case
        when p_outcome = 'deferred' then now()
        when p_outcome = 'succeeded' or p_outcome = 'failed' or attempt_count >= max_attempts then available_at
        else now() + least(interval '12 hours', interval '1 minute' * power(5, greatest(attempt_count - 1, 0)))
      end,
      lease_owner = null,
      lease_until = null,
      last_error_code = case when p_outcome in ('succeeded', 'deferred') then null else left(regexp_replace(coalesce(p_error_code, 'worker_failure'), '[^A-Za-z0-9_.-]', '_', 'g'), 80) end,
      last_error_detail = case when p_outcome in ('succeeded', 'deferred') then null else left(regexp_replace(coalesce(p_error_detail, ''), '[\\r\\n]+', ' ', 'g'), 240) end,
      completed_at = case when p_outcome = 'succeeded' or p_outcome = 'failed' or attempt_count >= max_attempts then now() else null end,
      updated_at = now()
  where id = p_id
    and state = 'running'
    and lease_owner = p_owner
    and lease_until is not null
    and lease_until > now()
    and p_owner is not null
    and char_length(p_owner) between 1 and 200
    and p_outcome in ('succeeded', 'deferred', 'retryable', 'failed')
  returning *;
$$;

revoke all on function public.trackmcp_record_refresh_job_result(uuid, text, text, text, text) from public, anon, authenticated;
grant execute on function public.trackmcp_record_refresh_job_result(uuid, text, text, text, text) to service_role;

comment on function public.trackmcp_record_refresh_job_result(uuid, text, text, text, text) is
  'Service-role-only lease-fenced refresh result transition; bounded cancellation requeues without a retry failure.';
