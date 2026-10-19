-- Founder OS CLI redemption reconciliation (READ ONLY)
-- Run in the authenticated Supabase SQL Editor. This report performs no data
-- writes and never selects raw API keys or device/user codes.

-- Result 1: sessions stuck in redeeming beyond the normal request window.
select
  count(*) filter (where status = 'redeeming' and redeemed_at < now() - interval '10 minutes')::bigint as stale_redeeming_count,
  count(*) filter (where status = 'redeeming')::bigint as redeeming_count,
  count(*) filter (where status = 'redeemed')::bigint as redeemed_count
from public.trackmcp_cli_device_sessions;

-- Result 2: lifecycle integrity mismatches. Zero rows is expected.
select id, status, redeemed_at, created_key_id
from public.trackmcp_cli_device_sessions
where (status in ('redeeming', 'redeemed') and (redeemed_at is null or approved_workspace_id is null))
   or (status = 'redeemed' and created_key_id is null)
   or (status in ('pending', 'approved', 'denied', 'expired') and redeemed_at is not null)
order by redeemed_at nulls last, id;

-- Result 3: redeemed sessions whose referenced key is missing or belongs to a
-- different workspace. Only IDs and workspace references are returned.
select s.id as session_id, s.approved_workspace_id, s.created_key_id,
       k.workspace_id as key_workspace_id
from public.trackmcp_cli_device_sessions s
left join public.trackmcp_api_keys k on k.id = s.created_key_id
where s.status = 'redeemed'
  and (k.id is null or k.workspace_id is distinct from s.approved_workspace_id)
order by s.id;

-- Result 4: count only; no key material is selected.
select count(*)::bigint as redeemed_sessions_with_key
from public.trackmcp_cli_device_sessions s
join public.trackmcp_api_keys k on k.id = s.created_key_id
where s.status = 'redeemed';
