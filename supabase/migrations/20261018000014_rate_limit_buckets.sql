-- Founder OS distributed rate-limit bucket contract.
-- REVIEW ONLY: do not execute automatically. The application enables this
-- provider only when TRACKMCP_RATE_LIMIT_MODE=supabase is explicitly set.

create table if not exists public.trackmcp_rate_limit_buckets (
  bucket_key text primary key check (char_length(bucket_key) between 1 and 128),
  window_started_at timestamptz not null,
  request_count integer not null check (request_count between 0 and 1000000),
  updated_at timestamptz not null default now()
);

create index if not exists trackmcp_rate_limit_buckets_updated_idx
  on public.trackmcp_rate_limit_buckets (updated_at);

alter table public.trackmcp_rate_limit_buckets enable row level security;
revoke all on public.trackmcp_rate_limit_buckets from anon, authenticated;

create or replace function public.trackmcp_consume_rate_limit(
  p_bucket_key text, p_limit integer, p_window_seconds integer
)
returns table(allowed boolean, retry_after_seconds integer)
language plpgsql security definer set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_row public.trackmcp_rate_limit_buckets%rowtype;
  v_window_end timestamptz;
begin
  if p_bucket_key is null or char_length(p_bucket_key) < 1 or char_length(p_bucket_key) > 128
     or p_limit is null or p_limit < 1 or p_limit > 1000000
     or p_window_seconds is null or p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'invalid rate limit arguments' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_bucket_key, 0));
  select * into v_row from public.trackmcp_rate_limit_buckets where bucket_key = p_bucket_key for update;
  if not found or v_row.window_started_at + make_interval(secs => p_window_seconds) <= v_now then
    insert into public.trackmcp_rate_limit_buckets(bucket_key, window_started_at, request_count, updated_at)
    values (p_bucket_key, v_now, 1, v_now)
    on conflict (bucket_key) do update set window_started_at = excluded.window_started_at,
      request_count = 1, updated_at = excluded.updated_at;
    return query select true, 0;
    return;
  end if;
  v_window_end := v_row.window_started_at + make_interval(secs => p_window_seconds);
  if v_row.request_count >= p_limit then
    return query select false, greatest(1, ceil(extract(epoch from (v_window_end - v_now)))::integer);
    return;
  end if;
  update public.trackmcp_rate_limit_buckets set request_count = request_count + 1, updated_at = v_now where bucket_key = p_bucket_key;
  return query select true, 0;
end;
$$;

revoke all on function public.trackmcp_consume_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.trackmcp_consume_rate_limit(text, integer, integer) to service_role;

create or replace function public.trackmcp_cleanup_rate_limit_buckets(
  p_max_age_seconds integer default 86400,
  p_max_rows integer default 10000
)
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  v_deleted integer;
begin
  if p_max_age_seconds is null or p_max_age_seconds < 60 or p_max_age_seconds > 2592000
     or p_max_rows is null or p_max_rows < 1 or p_max_rows > 100000 then
    raise exception 'invalid rate limit cleanup arguments' using errcode = '22023';
  end if;
  delete from public.trackmcp_rate_limit_buckets
   where bucket_key in (
     select bucket_key from public.trackmcp_rate_limit_buckets
      where updated_at < now() - make_interval(secs => p_max_age_seconds)
      order by updated_at asc
      limit p_max_rows
   );
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke all on function public.trackmcp_cleanup_rate_limit_buckets(integer, integer) from public, anon, authenticated;
grant execute on function public.trackmcp_cleanup_rate_limit_buckets(integer, integer) to service_role;
comment on table public.trackmcp_rate_limit_buckets is
  'Bounded hashed rate-limit buckets; the provider hashes again and never stores raw API keys or device codes.';
