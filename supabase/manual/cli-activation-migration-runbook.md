# CLI activation migration runbook

These migrations are review-only until an operator approves them in a staging
or disposable Supabase database. Apply them in this exact order:

1. `20261018000001_cli_device_authorization.sql`
2. `20261018000002_cli_activation_hardening.sql`
3. `20261018000003_cli_activation_reporting.sql`

Run each file in the authenticated Supabase SQL Editor or an approved staging
`psql` connection. Record the operator, timestamp, exact SQL revision, and
postflight checks. Do not run `supabase db push` against production.

Postflight checks:

```sql
select to_regclass('public.trackmcp_cli_device_sessions');
select to_regclass('public.trackmcp_activation_funnel_events');
select to_regclass('public.trackmcp_activation_milestones');
select has_function_privilege('service_role', 'public.trackmcp_activation_funnel_report(timestamptz, timestamptz)', 'EXECUTE');
select has_function_privilege('service_role', 'public.trackmcp_cleanup_cli_device_sessions(timestamptz)', 'EXECUTE');
```

The reporting migration is idempotent and creates/replaces only the reporting
and cleanup functions. If a rollback is required before application code uses
them, remove only those functions:

```sql
drop function if exists public.trackmcp_activation_funnel_report(timestamptz, timestamptz);
drop function if exists public.trackmcp_cleanup_cli_device_sessions(timestamptz);
```

Do not drop the device-session, activation-ledger, or milestone tables as a
routine rollback. Dropping those tables destroys activation data and requires a
separate data-retention decision.
