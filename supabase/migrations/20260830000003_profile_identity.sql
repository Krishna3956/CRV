alter table public.trackmcp_profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists terms_accepted_at timestamptz;
