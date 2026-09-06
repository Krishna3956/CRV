# P1-05 migration application

Apply `supabase/migrations/20260907000009_regressions_alerts.sql` manually in
the SQL Editor as one statement. It is forward-only, transactional, and
idempotent. It creates the alert configuration, destination, incident,
delivery, evaluation-lock, and evaluation-run tables plus ownership triggers,
indexes, constraints, and deny-by-default policies for direct `anon` and
`authenticated` access.

On replay, the migration validates every alert CHECK constraint exactly using
PostgreSQL's canonical `pg_get_constraintdef` output. It validates each alert
index's uniqueness, ordered key columns, and predicate from PostgreSQL catalog
metadata. Those are the complete automated index guarantees; access method,
included columns, collation, operator class, and explicit ASC/DESC/null
ordering are not asserted by the migration and must not be treated as part of
its compatibility guarantee.

Before production application, run the PostgreSQL 16 migration integration
suite and the read-only checks in `docs/p1-05-alerts-sql-editor.sql`. Confirm
that the lock functions are executable only by `service_role`, that no
cross-workspace destination links exist, and that revoked destinations are not
eligible for delivery. Do not use `supabase db push` because the repository
migration history is not reconciled.
