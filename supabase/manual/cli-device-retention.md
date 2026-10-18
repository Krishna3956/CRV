# CLI device-session retention

The device-session table is service-controlled. Clients must not receive table
grants, and all reads/writes go through authenticated route handlers using the
Supabase service-role client.

Expired, denied, redeemed, and abandoned sessions should be deleted after 24
hours by an approved operator job. Migration
`20261018000003_cli_activation_reporting.sql` provides the bounded,
service-role-only cleanup function. Invoke it manually or from an already
approved scheduler:

```sql
select public.trackmcp_cleanup_cli_device_sessions();
```

The function returns the number of deleted rows and rejects a future cleanup
boundary. To use a fixed audit boundary, pass an explicit timestamp that is not
in the future:

```sql
select public.trackmcp_cleanup_cli_device_sessions('2026-10-17T00:00:00Z'::timestamptz);
```

The equivalent cleanup predicate is:

```sql
delete from public.trackmcp_cli_device_sessions
where expires_at < now() - interval '24 hours'
   or (status in ('denied', 'redeemed') and coalesce(redeemed_at, created_at) < now() - interval '24 hours');
```

Do not export device-code hashes, user-code hashes, approval identifiers, or
raw key material. Activation milestones are retained under the product's
approved analytics retention policy and contain only bounded metadata.

The route-level memory limiter is intentionally best-effort because App Runner
may run multiple instances and restart processes. It is not the security
boundary: polling is also protected durably by `last_polled_at`, `poll_count`,
session expiry, and the single-use status transition in the device-session
table. Key-status, session-start, and activation-event limits should be backed
by the edge/API rate limiter before production rollout. This repository does
not assume that App Runner provides a shared limiter, and no scheduler is
assumed for the cleanup function.

Before production application, review migrations in this order:

1. `20261018000001_cli_device_authorization.sql`
2. `20261018000002_cli_activation_hardening.sql`
3. `20261018000003_cli_activation_reporting.sql`

Test them against a disposable PostgreSQL/Supabase environment, record the
SQL/operator/time, and apply them manually in the authenticated SQL Editor. Do
not run `supabase db push` or replay the migration directory against production.
The reporting migration is reversible only by dropping its two functions before
dependent code is deployed; do not drop the device-session or activation-ledger
tables as a rollback.
