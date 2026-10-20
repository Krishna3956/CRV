-- Prioritize due retryable refresh jobs so transient failures cannot be
-- starved indefinitely by a continuously replenished queued backlog.
-- Additive function replacement; no rows are deleted or rewritten.

create or replace function public.trackmcp_claim_refresh_job(
  p_owner text,
  p_lease_seconds integer default 300
)
returns setof public.trackmcp_refresh_jobs
language sql
security definer
set search_path = public
as $$
  with candidate as (
    select id
    from public.trackmcp_refresh_jobs
    where p_owner is not null
      and char_length(p_owner) between 1 and 200
      and p_lease_seconds between 5 and 3600
      and attempt_count < max_attempts
      and (
        (state in ('queued', 'retryable') and available_at <= now())
        or (state = 'running' and lease_until is not null and lease_until <= now())
      )
    order by case when state = 'retryable' then 0 else 1 end,
             available_at asc, created_at asc, id asc
    for update skip locked
    limit 1
  ), updated as (
    update public.trackmcp_refresh_jobs job
    set state = 'running',
        attempt_count = job.attempt_count + 1,
        lease_owner = p_owner,
        lease_until = now() + make_interval(secs => p_lease_seconds),
        updated_at = now()
    from candidate
    where job.id = candidate.id
    returning job.*
  )
  select * from updated;
$$;

revoke all on function public.trackmcp_claim_refresh_job(text, integer) from public, anon, authenticated;
grant execute on function public.trackmcp_claim_refresh_job(text, integer) to service_role;

comment on function public.trackmcp_claim_refresh_job(text, integer) is
  'Service-role-only atomic refresh-job claim; due retries are prioritized over queued backlog.';
