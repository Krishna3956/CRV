# TrackMCP AWS-hosted Supabase backup and recovery design

This is the proposed recovery posture; it is not evidence that AWS backups are active yet.

## Initial targets

- RPO: 24 hours for the first approved pilot, subject to measurement and owner approval.
- RTO: 4 hours for a single-instance recovery, subject to a tested restore.
- Upgrade path: more frequent exports/WAL strategy if measured write volume or business requirements make a 24-hour RPO insufficient.

## Backup set

1. Supported Supabase logical exports of roles, schema, and data, encrypted before or during transfer to a private S3 bucket.
2. Supabase Storage objects and metadata if the final inventory finds any dependency.
3. Deployment definitions, pinned component versions, environment-variable names, reverse-proxy configuration, and non-secret operational documentation.
4. Encrypted EBS snapshots as a secondary infrastructure recovery mechanism, not a substitute for a tested logical database restore.
5. CloudWatch logs/metrics and the migration ledger needed to reconstruct the incident timeline.

## Proposed retention

- Daily logical export: retain 14 days initially.
- Weekly recovery point: retain 8 weeks initially.
- Monthly recovery point: retain 12 months if cost remains within the approved envelope.
- Apply S3 lifecycle rules only after a restore test proves that the retained object is complete and readable.

## Restore drill

1. Create an isolated destination with no production DNS or credentials.
2. Restore roles, schema, and data using the supported Supabase procedure; do not blindly restore managed internal schemas.
3. Reapply destination secrets/JWT configuration and test the expected reauthentication behavior.
4. Restore Storage separately if applicable.
5. Run row-count, referential-integrity, RLS, Auth, API, and ownership tests.
6. Record start/end times, command versions, failures, and evidence in the ledger.
7. Destroy the isolated test resources only after confirming the evidence is retained; this requires explicit scope checking because deletion is destructive.

## Failure handling

A successful backup job is not sufficient. Any failed export, incomplete object sync, checksum mismatch, or restore-test failure keeps the backup phase BLOCKED and requires repair before cutover. Do not lower retention or disable encryption to make a failed backup appear healthy.
