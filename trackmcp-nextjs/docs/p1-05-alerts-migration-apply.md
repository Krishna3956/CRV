# P1-05 migration application

Apply `supabase/migrations/20260907000009_regressions_alerts.sql` manually in
the SQL Editor as one statement. It is forward-only, transactional, and
idempotent. It creates the alert configuration, destination, incident,
delivery, evaluation-lock, and evaluation-run tables plus ownership triggers,
indexes, constraints, and deny-by-default policies for direct `anon` and
`authenticated` access.

Before production application, run the PostgreSQL 16 migration integration
suite and the read-only checks in `docs/p1-05-alerts-sql-editor.sql`. Confirm
that the lock functions are executable only by `service_role`, that no
cross-workspace destination links exist, and that revoked destinations are not
eligible for delivery. Do not use `supabase db push` because the repository
migration history is not reconciled.
