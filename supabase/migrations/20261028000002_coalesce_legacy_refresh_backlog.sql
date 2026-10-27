-- Founder OS legacy refresh backlog coalescing.
-- REVIEW ONLY: apply after 20261028000001 and after capturing the read-only
-- legacy backlog preview. This changes only durable queue state; telemetry and
-- derived rows are not deleted.

create or replace function public.trackmcp_coalesce_legacy_refresh_backlog(
  p_limit integer default 50000
)
returns table(canonical_job_count bigint, cancelled_job_count bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  canonical_count bigint := 0;
  cancelled_count bigint := 0;
begin
  if p_limit is null or p_limit < 1 or p_limit > 50000 then
    return query select 0::bigint, 0::bigint;
    return;
  end if;

  -- One canonical row per workspace/window/kind. The source window is already
  -- encoded in the legacy fingerprint key, so this does not broaden a read
  -- beyond the same bounded projection range used by the old jobs.
  with legacy_groups as (
    select distinct on (workspace_id, kind, substring(dedupe_key from '^ingest-window:([0-9]+):'))
      workspace_id,
      kind,
      substring(dedupe_key from '^ingest-window:([0-9]+):')::bigint as window_id
    from public.trackmcp_refresh_jobs
    where state in ('queued', 'retryable')
      and kind in ('fact_projection', 'action_queue_refresh', 'catalog_recompute', 'catalog_entity_recompute')
      and dedupe_key ~ '^ingest-window:[0-9]+:[a-f0-9]{64}:[a-z_]+$'
    order by workspace_id, kind, substring(dedupe_key from '^ingest-window:([0-9]+):'), substring(dedupe_key from '^ingest-window:([0-9]+):')::bigint
    limit p_limit
  )
  insert into public.trackmcp_refresh_jobs as target (
    workspace_id, kind, dedupe_key, state, attempt_count,
    available_at, request_revision, lease_revision,
    last_error_code, last_error_detail, completed_at, updated_at
  )
  select workspace_id,
         kind,
         format('ingest-window:%s:%s', window_id, kind),
         'queued',
         0,
         now(),
         1,
         null,
         null,
         null,
         null,
         now()
  from legacy_groups
  on conflict (workspace_id, kind, dedupe_key) do update
    set state = case when target.state = 'running' then target.state else 'queued' end,
        attempt_count = case when target.state = 'running' then target.attempt_count else 0 end,
        available_at = case when target.state = 'running' then target.available_at else excluded.available_at end,
        lease_owner = case when target.state = 'running' then target.lease_owner else null end,
        lease_until = case when target.state = 'running' then target.lease_until else null end,
        lease_revision = case when target.state = 'running' then target.lease_revision else null end,
        request_revision = greatest(target.request_revision, excluded.request_revision),
        last_error_code = case when target.state = 'running' then target.last_error_code else null end,
        last_error_detail = case when target.state = 'running' then target.last_error_detail else null end,
        completed_at = case when target.state = 'running' then target.completed_at else null end,
        updated_at = excluded.updated_at;

  with canonical_groups as (
    select distinct workspace_id, kind,
      format('ingest-window:%s:%s', substring(dedupe_key from '^ingest-window:([0-9]+):')::bigint, kind) as canonical_key
    from public.trackmcp_refresh_jobs
    where state in ('queued', 'retryable')
      and kind in ('fact_projection', 'action_queue_refresh', 'catalog_recompute', 'catalog_entity_recompute')
      and dedupe_key ~ '^ingest-window:[0-9]+:[a-f0-9]{64}:[a-z_]+$'
    limit p_limit
  )
  select count(*) into canonical_count from canonical_groups;

  update public.trackmcp_refresh_jobs job
  set state = 'cancelled',
      lease_owner = null,
      lease_until = null,
      lease_revision = null,
      last_error_code = 'coalesced_legacy',
      last_error_detail = 'replaced by the canonical ingest-window refresh job',
      completed_at = now(),
      updated_at = now()
  where job.state in ('queued', 'retryable')
    and job.kind in ('fact_projection', 'action_queue_refresh', 'catalog_recompute', 'catalog_entity_recompute')
    and job.dedupe_key ~ '^ingest-window:[0-9]+:[a-f0-9]{64}:[a-z_]+$'
    and exists (
      select 1
      from public.trackmcp_refresh_jobs canonical
      where canonical.workspace_id = job.workspace_id
        and canonical.kind = job.kind
        and canonical.dedupe_key = format('ingest-window:%s:%s', substring(job.dedupe_key from '^ingest-window:([0-9]+):')::bigint, job.kind)
    )
    and job.dedupe_key <> format('ingest-window:%s:%s', substring(job.dedupe_key from '^ingest-window:([0-9]+):')::bigint, job.kind);
  get diagnostics cancelled_count = row_count;

  return query select canonical_count, cancelled_count;
end;
$$;

revoke all on function public.trackmcp_coalesce_legacy_refresh_backlog(integer) from public, anon, authenticated;
grant execute on function public.trackmcp_coalesce_legacy_refresh_backlog(integer) to service_role;

comment on function public.trackmcp_coalesce_legacy_refresh_backlog(integer) is
  'Service-role-only bounded coalescing of legacy fingerprinted refresh queue rows; telemetry rows are never deleted.';
