# TrackMCP AWS Supabase migration pause

**Checkpoint:** 2026-11-02 12:22 IST
**Status:** PAUSED by owner
**Current production backend:** Supabase Cloud
**Resume posture:** reversible; do not delete the retained AWS artifacts

## Executive summary

The owner upgraded the existing Supabase Cloud organization to a paid plan and asked us to pause the AWS migration for roughly 10–20 days. The migration is therefore paused at the isolated-staging validation boundary. Supabase Cloud remains the source of truth, the production application was not cut over, and no production traffic was directed to AWS.

The two active EC2 hosts used only for isolated migration staging have been stopped. They were not terminated, so their attached volumes and CloudFormation definitions remain available for a later resume. The private, versioned backup bucket and the staging secret container were retained deliberately. No Supabase Cloud project, user, identity, password, production credential, DNS record, App Runner configuration, or live application traffic was deleted or changed by the migration work.

## What changed and what did not

### Production boundary

The migration work did not change:

- Supabase Cloud production data, users, identities, OAuth providers, or project settings.
- TrackMCP production DNS, App Runner configuration, deployment environment variables, or live traffic.
- Production Supabase URL, publishable/anonymous key, service-role key, or database password.
- Google or GitHub OAuth callback configuration.

The application integration remains centralized through the existing environment variables documented in [`docs/aws-supabase-compatibility-matrix.md`](./aws-supabase-compatibility-matrix.md). No production value was replaced with an AWS value.

### Migration work completed

The repository now contains the design, guarded automation, and operational runbooks needed to resume:

- Architecture and cost comparison: [`docs/aws-supabase-architecture.md`](./aws-supabase-architecture.md).
- Compatibility and application integration inventory: [`docs/aws-supabase-compatibility-matrix.md`](./aws-supabase-compatibility-matrix.md).
- Cutover and rollback procedure: [`docs/aws-supabase-cutover-runbook.md`](./aws-supabase-cutover-runbook.md).
- Backup and recovery design: [`docs/aws-supabase-backup-recovery.md`](./aws-supabase-backup-recovery.md).
- Secret names, custody rules, and non-secret configuration inventory: [`docs/aws-supabase-secret-inventory.md`](./aws-supabase-secret-inventory.md).
- Source export and restore gates: [`docs/aws-supabase-source-export.md`](./aws-supabase-source-export.md) and `.github/workflows/probe-supabase-source-restore.yml`.
- Reproducible isolated infrastructure definition: [`infra/aws-supabase/README.md`](../infra/aws-supabase/README.md) and [`infra/aws-supabase/template.yaml`](../infra/aws-supabase/template.yaml).
- Chronological execution record: [`docs/aws-supabase-migration-ledger.md`](./aws-supabase-migration-ledger.md).

The isolated staging path reached a healthy self-hosted Supabase stack, including database readiness, Auth, REST, and the Supavisor repair. The final health evidence was recorded before shutdown. The source export was not run because the repository secret `SUPABASE_SOURCE_DB_URL` was never created; no source credential or source data was copied.

## AWS resources retained for resume

Region: `us-east-1`.

| Resource | State at pause | Decision |
|---|---|---|
| CloudFormation `trackmcp-supabase-staging-18` | Retained; EC2 `i-0003c2c1d1931a2b8` verified `Stopped` | Keep for resume; do not delete automatically |
| CloudFormation `trackmcp-supabase-staging-24` | Retained; EC2 `i-0eb13e22491e698d7` verified `Stopped` | Keep for resume; do not delete automatically |
| S3 backup bucket `trackmcp-supabase-backups-872575360367-us-east-1` | Private, versioned, public-access-blocked, AES256 server-side encryption | Retain as recovery custody |
| Staging Secrets Manager container | Retained; values were not read into the repository | Retain; rotate or remove only during a deliberate cleanup review |
| GitHub OIDC deployment role and narrow staging permissions | Retained for the guarded workflows | Review and narrow/remove during a later security cleanup, without breaking production CI |
| Failed/rolled-back CloudFormation history | Retained where AWS keeps it | Historical evidence; do not treat as active production infrastructure |

The EC2 stop operations were graceful stop requests, not termination. AWS confirmed that stopped instances no longer incur instance usage or data-transfer charges. AWS can still charge for attached EBS volumes and other retained resources.

## Expected residual AWS billing

Stopping the EC2 hosts removes the largest ongoing compute cost, but it does not make the AWS footprint free. Small residual charges may remain for:

- EBS volumes attached to the stopped hosts.
- S3 storage, versioning, and any future requests in the retained backup bucket.
- Secrets Manager storage for the retained staging secret container.
- CloudWatch or other logs if any were emitted.
- Any public IPv4 address that remains allocated; the stopped hosts showed no Elastic IP, and their auto-assigned public addresses were released when they stopped.

The backup bucket and volumes were intentionally retained because they make resumption and recovery safer. Before resuming, check Cost Explorer and the AWS billing dashboard for actual charges. Do not delete the bucket or volumes merely to save a small amount without first deciding whether the migration artifacts and any staging data are still needed.

## Resume checklist

When the owner is ready, follow this order:

1. Confirm the Supabase Cloud production project is healthy on the paid plan and remains the rollback/source-of-truth system.
2. Review AWS Cost Explorer, Activate-credit balance, and the retained resource list.
3. Start exactly one retained staging stack/host; do not start both hosts unless a specific test requires it.
4. Run the guarded staging inspection and health workflows. Repair any drift before using the host.
5. Obtain the existing source Postgres connection string through the approved secret store. Do not reset the Supabase database password unless the owner deliberately accepts breaking existing connections.
6. Create `SUPABASE_SOURCE_DB_URL` only in the repository secret store. Never place its value in this repository, logs, issues, or pull requests.
7. Run the filtered source export, verify its checksum/encryption/restore readability, and retain the original Supabase Cloud project unchanged.
8. Restore into an isolated temporary database and compare schema, migrations, critical row counts, identities, ownership, and RLS behavior.
9. Update only a staging deployment with staging keys and URLs. Do not change production configuration during parity testing.
10. Prepare a fresh cutover decision with downtime, session invalidation, rollback consistency, backup restore evidence, and owner approval. Production cutover remains a separate explicit gate.

The migration is not complete merely because the staging stack was healthy. The remaining gates are source export, data/auth parity, full application UAT, recovery restore evidence, cost confirmation, and an explicit production cutover approval.

## Credential and key custody

No secret values are recorded here. The following custody rules remain in force:

- Supabase Cloud production keys and passwords stay in Supabase/GitHub/AWS secret stores where they already belong.
- AWS staging values stay in the staging secret container and are not copied into Markdown, workflow output, issues, or commits.
- `SUPABASE_SOURCE_DB_URL` is absent at this checkpoint, so the source export is intentionally gated.
- Any future self-hosted JWT, database, OAuth, SMTP, or service-role values must be generated for the destination and stored separately from production values.
- Existing production sessions should be assumed invalid after a future self-hosted Auth cutover unless an explicit compatibility test proves otherwise.

## Owner decision recorded

The owner selected the paid Supabase Cloud plan for the current period and instructed the migration to pause. This document records the pause; it does not change the paid Supabase plan, delete any project, or make a production cutover.
