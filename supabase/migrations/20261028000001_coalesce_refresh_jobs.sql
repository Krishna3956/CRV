-- Founder OS refresh-job window coalescing.
-- REVIEW ONLY: apply manually after the queue postflight has been captured.
-- A single ingest window can receive many accepted batches. The request
-- revision preserves late-ingest invalidation without creating one durable
-- projection job per batch. No telemetry rows are deleted by this migration.

alter table public.trackmcp_refresh_jobs
  add column if not exists request_revision bigint not null default 0
    check (request_revision >= 0),
  add column if not exists lease_revision bigint;

create or replace function public.trackmcp_enqueue_refresh_jobs(
  p_workspace_id uuid,
  p_window bigint,
  p_requested_at timestamptz default now()
)
returns setof public.trackmcp_refresh_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  job_kind text;
  result_row public.trackmcp_refresh_jobs;
  dedupe text;
begin
  if p_workspace_id is null or p_window is null or p_window < 0
     or p_window > 1000000000000 or p_requested_at is null then
    return;
  end if;

  foreach job_kind in array array[
    'fact_projection', 'action_queue_refresh',
    'catalog_recompute', 'catalog_entity_recompute'
  ] loop
    dedupe := format('ingest-window:%s:%s', p_window, job_kind);
    insert into public.trackmcp_refresh_jobs as target (
      workspace_id, kind, dedupe_key, state, attempt_count,
      available_at, request_revision, lease_revision,
      last_error_code, last_error_detail, completed_at, updated_at
    ) values (
      p_workspace_id, job_kind, dedupe, 'queued', 0,
      p_requested_at, 1, null, null, null, null, p_requested_at
    )
    on conflict (workspace_id, kind, dedupe_key) do update
    set request_revision = target.request_revision + 1,
        state = case when target.state = 'running' then target.state else 'queued' end,
        attempt_count = case when target.state = 'running' then target.attempt_count else 0 end,
        available_at = case when target.state = 'running' then target.available_at else excluded.available_at end,
        lease_owner = case when target.state = 'running' then target.lease_owner else null end,
        lease_until = case when target.state = 'running' then target.lease_until else null end,
        lease_revision = case when target.state = 'running' then target.lease_revision else null end,
        last_error_code = case when target.state = 'running' then target.last_error_code else null end,
        last_error_detail = case when target.state = 'running' then target.last_error_detail else null end,
        completed_at = case when target.state = 'running' then target.completed_at else null end,
        updated_at = excluded.updated_at
    returning target.* into result_row;
    return next result_row;
  end loop;
end;
$$;

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
        lease_revision = job.request_revision,
        updated_at = now()
    from candidate
    where job.id = candidate.id
    returning job.*
  )
  select * from updated;
$$;

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
        when p_outcome = 'deferred' then 'queued'
        when p_outcome = 'succeeded' and request_revision <> coalesce(lease_revision, request_revision) then 'queued'
        when p_outcome = 'succeeded' then 'succeeded'
        when p_outcome = 'failed' or attempt_count >= max_attempts then 'failed'
        else 'retryable'
      end,
      available_at = case
        when p_outcome = 'deferred' then now()
        when p_outcome = 'succeeded' and request_revision <> coalesce(lease_revision, request_revision) then now()
        when p_outcome = 'succeeded' or p_outcome = 'failed' or attempt_count >= max_attempts then available_at
        else now() + least(interval '12 hours', interval '1 minute' * power(5, greatest(attempt_count - 1, 0)))
      end,
      lease_owner = null,
      lease_until = null,
      lease_revision = null,
      last_error_code = case
        when p_outcome in ('succeeded', 'deferred') then null
        else left(regexp_replace(coalesce(p_error_code, 'worker_failure'), '[^A-Za-z0-9_.-]', '_', 'g'), 80)
      end,
      last_error_detail = case
        when p_outcome in ('succeeded', 'deferred') then null
        else left(regexp_replace(coalesce(p_error_detail, ''), '[\\r\\n]+', ' ', 'g'), 240)
      end,
      completed_at = case
        when p_outcome = 'succeeded' and request_revision <> coalesce(lease_revision, request_revision) then null
        when p_outcome = 'deferred' then null
        when p_outcome = 'succeeded' or p_outcome = 'failed' or attempt_count >= max_attempts then now()
        else null
      end,
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

revoke all on function public.trackmcp_enqueue_refresh_jobs(uuid, bigint, timestamptz) from public, anon, authenticated;
revoke all on function public.trackmcp_claim_refresh_job(text, integer) from public, anon, authenticated;
revoke all on function public.trackmcp_record_refresh_job_result(uuid, text, text, text, text) from public, anon, authenticated;
grant execute on function public.trackmcp_enqueue_refresh_jobs(uuid, bigint, timestamptz) to service_role;
grant execute on function public.trackmcp_claim_refresh_job(text, integer) to service_role;
grant execute on function public.trackmcp_record_refresh_job_result(uuid, text, text, text, text) to service_role;

comment on column public.trackmcp_refresh_jobs.request_revision is
  'Incremented when a new ingest batch requests the same projection window; late requests requeue after the active lease completes.';
comment on function public.trackmcp_enqueue_refresh_jobs(uuid, bigint, timestamptz) is
  'Service-role-only idempotent refresh enqueue by workspace and 15-minute ingest window.';
