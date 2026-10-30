# TrackMCP production backup and recovery runbook

Status: engineering-ready; the controlled first-100 pilot uses the accepted
Free-plan limitation recorded below. This runbook is deliberately
non-destructive. It does not execute a
Supabase migration, read a service-role secret, delete customer data, or claim
that the Free plan provides backups or point-in-time recovery.

## Current boundary

The production Supabase project is on the Free plan. The recorded inspection
found no usable scheduled backup, PITR restore point, restoration contact, or
completed restore rehearsal. Until that changes, the controlled pilot must
treat the database as an explicit accepted recovery limitation; expansion
beyond the pilot remains blocked until the provider path or a stronger recovery
decision is evidenced.

The application is designed for additive migrations and immutable App Runner
releases, but application rollback is not database recovery. A rollback image
cannot restore a deleted or corrupted Supabase row.

## Required decision before a broader-than-pilot release

Choose one of these two explicit paths and record the decision, date, operator,
and evidence link in the readiness ledger:

1. **Provider recovery path (recommended):** move to a Supabase plan with
   scheduled backups and PITR, name the restoration owner, capture the backup
   retention and RPO, and complete a disposable-project restore rehearsal.
2. **Accepted limitation path:** keep the Free plan, document that recovery is
   logical-export-only with a best-effort RPO/RTO, name the release owner who
   accepts the risk, and do not describe the pilot as having automated backup
   or PITR protection.

No code or CI result can substitute for this decision.

## Engineering recovery targets

Until the provider path is enabled, use these explicit targets for planning:

- **RPO:** not guaranteed. A logical export is only as current as its last
  successful run; never promise zero data loss.
- **RTO:** not guaranteed. A restore requires a disposable Supabase project,
  reviewed migrations, configuration, and a verified App Runner deployment.
- **Scope:** workspace-scoped telemetry, semantic facts, refresh jobs, action
  queue, catalog projections, privacy requests, activation milestones, and
  migration execution evidence. Secrets, API keys, bearer tokens, cookies,
  device codes, and raw customer payloads must not be exported into this
  repository or evidence artifact.

## Preflight checklist

Run from a controlled operator environment. Use a short-lived, least-privilege
database credential supplied through the provider secret manager or dashboard;
never place it in shell history, `.env`, GitHub logs, or a report.

- [ ] Confirm the project ref, region, current release SHA, and migration
      ledger version.
- [ ] Confirm the target export location has encryption, access control, and a
      documented retention period.
- [ ] Confirm no customer-facing deletion, retention cleanup, or migration is
      running during the export.
- [ ] Capture the export timestamp and schema migration watermark only; do not
      capture credentials or raw rows in the readiness ledger.
- [ ] Verify the export is encrypted and readable by the recovery operator
      before treating it as evidence.

## Logical export procedure

Use the Supabase-supported logical backup/export facility for the selected
project, or an approved `pg_dump` equivalent from a controlled runner. The
exact command is provider- and credential-dependent and must be filled in by
the operator at execution time. Do not invent a production connection URL in
this repository.

The export must include schema and data for the approved application tables,
but must exclude provider-managed auth internals and all secret material unless
the provider's supported recovery process requires them. Record only:

- project ref (not a credential);
- UTC start/end;
- schema/migration watermark;
- encrypted artifact identifier;
- byte count and checksum;
- operator and retention expiry;
- redacted command/tool name.

## Disposable restore rehearsal

Perform this before release approval or after any migration batch that changes
the read model:

1. Create or select a disposable Supabase project in the approved region.
2. Apply the exact reviewed migrations in repository order.
3. Restore the encrypted logical export using the provider's supported import
   path. Never restore into production for a rehearsal.
4. Configure only disposable App Runner/runtime credentials and a disposable
   workspace key. Do not copy production secrets.
5. Run the read-only postflight checks:
   `supabase/manual/founder-os-complete-postflight.sql`, the migration parity
   postflight, RLS/tenant checks, and the refresh-worker health postflight.
6. Run the application release gate, authenticated read-only smoke, first-event
   smoke, and a bounded refresh-worker run against the disposable project.
7. Verify workspace isolation, semantic-fact counts, catalog projections,
   action-queue state, privacy export shape, and migration watermark.
8. Record elapsed restore time, checksums, row-count deltas, failed checks, and
   the disposable project identifier in a redacted recovery report.
9. Destroy the disposable project through the provider's approved process and
   retain only the redacted report and encrypted export according to policy.

## Recovery and rollback order

If production data is unavailable or corrupted:

1. Declare the incident and freeze destructive mutations.
2. Preserve the last known-good App Runner image digest and release SHA.
3. Determine whether the incident is application-only, schema-only, or data
   loss. Do not roll back an application image to solve data loss.
4. For application-only incidents, use the reviewed App Runner rollback and
   run the production smoke plus release-identity checks.
5. For schema/data incidents, create the recovery project or provider restore
   point, apply the approved restore procedure, run all postflights, and obtain
   release-owner approval before reconnecting production traffic.
6. Reconcile events accepted during the recovery window using idempotent event
   IDs and the reviewed refresh-worker replay procedure. Never replay raw
   payloads outside the approved ingestion path.
7. Record the final RPO/RTO, data-loss assessment, restored SHA, migration
   watermark, and follow-up actions.

## Acceptance criteria

The backup/PITR gate may be marked complete only when one of the following is
true:

- provider backups/PITR are enabled, retention and RPO are recorded, a
  disposable restore rehearsal passes all postflights and UAT checks, and the
  restoration owner accepts the evidence; or
- the release owner explicitly accepts the Free-plan limitation with the
  logical-export procedure, named recovery operator, best-effort RPO/RTO, and
  a dated follow-up to upgrade or rehearse recovery.

Until then, the readiness ledger must continue to show **HOLD**. This document
is a recovery control and does not itself close the external gate.
