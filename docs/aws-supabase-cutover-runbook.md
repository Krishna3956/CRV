# TrackMCP AWS-hosted Supabase cutover runbook

This runbook is a preparation artifact. It does not authorize provisioning or production changes. The existing Supabase Cloud project must remain available until the rollback window is closed by the release owner.

## Entry criteria

- Architecture and monthly cost are approved, including current, 2x, and 5x usage envelopes.
- Staging has been deployed from a pinned official self-hosted Supabase release.
- Database, Auth, RLS, OAuth, application, security, backup, and restoration tests have executed successfully.
- A fresh source backup has been restored into an isolated environment and independently checked.
- Destination HTTPS, SMTP, OAuth provider settings, secrets, monitoring, and backup jobs are configured.
- The release owner has approved the migration window, expected downtime, rollback owner, and session transition.

## Pre-cutover checklist

1. Announce a deployment freeze and stop nonessential scheduled writes.
2. Verify the source project is healthy enough to export and record the source project status, migration revision, Auth user count, critical table counts, and storage inventory.
3. Create and retain a fresh supported Supabase export of roles, schema, and data. Keep the export outside the instance and encrypt it.
4. Run the final staging restore from the same export procedure. Record checksums/counts for ownership, workspace, server, API-key metadata, events, and Auth identity tables.
5. Confirm destination migrations, extensions, RLS policies, functions, triggers, and grants match the approved baseline.
6. Confirm the destination has no public Postgres, Kong admin, Docker, or Studio exposure. Confirm SSH-free/SSM administration and least-privilege IAM.
7. Configure the destination SMTP and OAuth providers. Add the exact app callback URL, preserve only required redirect URLs, and test provider denial/error paths.
8. Prepare the App Runner secret/build update. Do not apply it yet.
9. Capture a final source backup immediately before the write freeze.

## Cutover sequence

1. Display maintenance messaging and disable writes at the application boundary if the product has an existing safe maintenance control.
2. Stop or pause ingestion and background jobs. Verify no worker is still writing to the source.
3. Perform the final source export and restore/synchronization to the destination.
4. Compare critical row counts, ownership relationships, Auth user IDs, identity provider rows, and any Storage objects.
5. Point the approved App Runner configuration at the destination URL and keys. Keep the source configuration securely available for rollback; do not expose it in logs.
6. Deploy the application through the existing controlled App Runner workflow.
7. Validate destination HTTPS, `/auth/callback`, password login, OAuth, session refresh, dashboard reads, MCP submission, ownership attribution, API-key lifecycle, worker behavior, and alert/action paths.
8. Re-enable writes/jobs only after smoke tests pass and monitoring is green.
9. Watch error rate, Auth failures, database connections, CPU, memory, disk, network, backup status, and AWS credit/budget signals continuously through the agreed observation window.

## Rollback rule

Rollback is not a blind environment-variable reversal. Once destination writes occur, switching traffic back to the old Supabase database creates split-brain data and can lose new ownership, server, key, event, or Auth changes. Roll back only if the release owner declares the destination unusable and one of these is true:

- no destination writes occurred after cutover; or
- all destination writes have been exported and reconciled into the source with a verified, repeatable procedure.

If rollback is required, freeze writes first, preserve destination logs/backups, decide whether source or destination is authoritative, reconcile only through reviewed scripts, and re-run the integrity checks before reopening traffic. If reconciliation is not safe within the incident window, keep the destination authoritative and restore service there while repairing forward.

## Expected impact

The migration should target a short maintenance window for the final export/configuration switch. The actual duration depends on database size, export/restore speed, and OAuth/provider checks; it must be measured in staging rather than promised in advance. Existing sessions may require reauthentication if destination JWT signing/session state differs.

## Exit criteria

- No critical smoke or security test is failing.
- Critical counts and ownership relationships match the approved source snapshot.
- Backup and restoration evidence is recorded.
- Monitoring and billing signals are active.
- The release owner records the cutover decision and rollback-window end time.
- The original Supabase Cloud project remains intact until that window expires.
