-- Founder OS privacy deletion-request foundation.
-- REVIEW ONLY: do not execute automatically. This records requests; it never deletes data.

create table if not exists public.trackmcp_privacy_requests (
  id uuid primary key default gen_random_uuid(),
  requester_user_id uuid not null references auth.users(id),
  workspace_id uuid references public.trackmcp_workspaces(id),
  request_type text not null check (request_type = 'delete'),
  status text not null default 'requested'
    check (status in ('requested', 'under_review', 'approved', 'rejected', 'processing', 'completed', 'cancelled')),
  idempotency_key text not null check (char_length(idempotency_key) between 1 and 128),
  reason_category text check (reason_category is null or reason_category in ('user_requested', 'privacy_concern', 'account_closure', 'other')),
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewer_user_id uuid references auth.users(id),
  approved_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  review_note text check (review_note is null or char_length(review_note) <= 500),
  audit_metadata jsonb not null default '{}'::jsonb
    check (octet_length(audit_metadata::text) <= 8192),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trackmcp_privacy_requests_terminal_timestamps check (
    (status <> 'completed' or completed_at is not null)
    and (status <> 'cancelled' or cancelled_at is not null)
  )
);

create unique index if not exists trackmcp_privacy_requests_requester_idempotency_idx
  on public.trackmcp_privacy_requests (requester_user_id, idempotency_key);
create index if not exists trackmcp_privacy_requests_workspace_status_idx
  on public.trackmcp_privacy_requests (workspace_id, status, requested_at desc);
create index if not exists trackmcp_privacy_requests_review_queue_idx
  on public.trackmcp_privacy_requests (status, requested_at asc)
  where status in ('requested', 'under_review', 'approved', 'processing');

alter table public.trackmcp_privacy_requests enable row level security;
revoke all on public.trackmcp_privacy_requests from anon, authenticated;

comment on table public.trackmcp_privacy_requests is
  'Authenticated deletion requests awaiting explicit review; no request path performs destructive deletion.';
comment on column public.trackmcp_privacy_requests.audit_metadata is
  'Bounded non-secret audit context only; never store raw keys, payloads, auth tokens, or exported data.';
