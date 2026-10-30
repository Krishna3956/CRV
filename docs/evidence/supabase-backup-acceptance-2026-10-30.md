# Supabase backup/recovery acceptance — 2026-10-30

This is a redacted release-owner acceptance record. It contains no database
connection string, credential, secret, customer row, export, or raw payload.

## Provider inspection

- Project ref: `qficcofvzidpvkltjkmo`
- Region: `us-east-1` / East US (North Virginia)
- Compute: Supabase Free plan, Nano/shared compute
- Scheduled backups: not available on the inspected plan
- PITR: disabled; no provider restore point was claimed
- Inspection surface: authenticated Supabase Project Settings and
  Infrastructure pages on 2026-10-30

## Accepted first-100 limitation

The release owner accepts the Free-plan limitation for a controlled first-100
pilot. TrackMCP must describe recovery as logical-export-only and best effort;
it must not claim automated backups, PITR, zero-data-loss RPO, or a tested
provider restore point.

- Named recovery/rollback owner: release owner / project operator
- Recovery contact: `krishnaatmu@gmail.com`
- RPO: not guaranteed; bounded by the most recent successful logical export
- RTO: not guaranteed; recovery requires a disposable project, reviewed
  migrations, configuration, and a verified App Runner deployment
- Procedure: `docs/FOUNDER-OS-BACKUP-RECOVERY-RUNBOOK.md`
- Follow-up: reassess plan upgrade or disposable restore rehearsal by
  2026-11-30, before expanding beyond the controlled pilot

This closes the backup/recovery gate only as an explicitly accepted pilot
limitation. It is not provider backup/PITR evidence and does not authorize an
unbounded production launch.
