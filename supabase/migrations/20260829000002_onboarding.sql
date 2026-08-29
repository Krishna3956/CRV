create table if not exists public.trackmcp_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  company_name text,
  role text,
  use_case text,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.trackmcp_profiles enable row level security;
revoke all on public.trackmcp_profiles from anon, authenticated;
