# CLI device-session retention

The device-session table is service-controlled. Clients must not receive table
grants, and all reads/writes go through authenticated route handlers using the
Supabase service-role client.

Expired, denied, redeemed, and abandoned sessions should be deleted after 24
hours by an approved operator job. The cleanup predicate is:

```sql
delete from public.trackmcp_cli_device_sessions
where expires_at < now() - interval '24 hours'
   or (status in ('denied', 'redeemed') and coalesce(redeemed_at, created_at) < now() - interval '24 hours');
```

Do not export device-code hashes, user-code hashes, approval identifiers, or
raw key material. Activation milestones are retained under the product's
approved analytics retention policy and contain only bounded metadata.

Before production application, review this migration, test it against a
disposable PostgreSQL/Supabase environment, record the SQL/operator/time, and
apply it manually in the authenticated SQL Editor. Do not run `supabase db push`
or replay the migration directory against production.
