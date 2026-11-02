# TrackMCP AWS-hosted Supabase migration ledger

**Goal:** Move TrackMCP from Supabase Cloud Free to an AWS Activate-funded, self-hosted Supabase deployment with the smallest safe application change, while preserving users, authentication, data, security, backups, and rollback safety.

**Status:** IN PROGRESS  
**Last updated:** 2026-11-02 05:00 IST
**Repository:** `/Users/krishna/Documents/Codex/2026-10-17/okay-x20/CRV`  
**Branch:** `codex/record-final-go`

## Safety gates

- [x] Owner approval recorded on 2026-11-01 for billable AWS staging resources within the documented cost envelope; no production cutover is included.
- [ ] No production DNS, credentials, authentication configuration, database connection, or live traffic is changed before explicit cutover approval.
- [ ] The existing Supabase Cloud project remains available during the agreed rollback window and is not deleted automatically.
- [ ] Secrets and credentials are never printed, committed, or copied into this ledger.
- [ ] Any migration must have verified data integrity, tested restoration, and a documented split-brain-safe rollback procedure.
- [ ] The existing Supabase Cloud project, data, and rollback copy remain intact; no deletion is authorized by this goal.
- [ ] Secret values never enter the repository, GitHub issue, or evidence artifacts; only the redacted inventory is maintained.

## Phase status

| Phase | Status | Evidence / next gate |
|---|---|---|
| 1. Existing-system discovery | VERIFIED / PARTIAL | Repository inventory and authenticated cloud read-only checks completed; exact database bytes, egress total, and Storage inventory remain unavailable or incomplete. Public edge availability has now been separately diagnosed. |
| 2. AWS/Supabase research and architecture | VERIFIED / OPERATING ASSUMPTION | Official self-hosting/restore guidance, current credit state, planning prices, and the approved staging envelope are recorded; region/size remain measurable staging decisions. |
| 3. Infrastructure as code / deployment process | VERIFIED / OPERATING | Guarded GitHub OIDC workflow, CloudFormation baseline, redacted custody inventory, recovery runbooks, and bounded schema-apply diagnostics are merged on `main`; production resources remain unchanged. |
| 4. Isolated AWS staging | VERIFIED / OPERATING | Bootstrap run #29 (`41356840354`) and inspection #9 (`41361733463`) passed. Schema replay run #11 (`41361605465`) passed from `main` with `STAGING_PUBLIC_SCHEMA_RESET` and `STAGING_SCHEMA_APPLIED`; the isolated stack is preserved. |
| 5. Database/Auth/storage migration | BLOCKED / SOURCE EXPORT REQUIRED | The empty staging schema now replays successfully. Source REST access remains HTTP 402 (`Egress Exceeded`); authenticated SQL Editor read-only counts work, but a consistent public-data export and supported Auth/password-hash export are still required. |
| 6. TrackMCP integration updates | VERIFIED / PENDING STAGING UAT | Centralized environment-variable integration has been identified; no production values changed. Compatibility matrix records the exact auth/deploy files. |
| 7. Comprehensive testing | IN PROGRESS | Lint and targeted auth/deploy/migration/secret/rollback contract suites passed; isolated staging infrastructure and schema replay are now verified. Application/auth/RLS UAT remains pending source data and credentials. |
| 8. Backups and disaster recovery | IN PROGRESS | Existing Free-plan posture has no scheduled provider backup/PITR; preserve Supabase Cloud and create/verify an encrypted logical export before AWS migration. |
| 9. Production cutover preparation | BLOCKED | Runbook can be prepared; cutover itself requires explicit owner approval. |
| 10. Production operation | NOT STARTED | Begins only after approved cutover and verified migration. |

## Initial repository evidence

Read-only commands executed on 2026-11-01:

- `rg --files supabase/migrations | wc -l` -> **45 migration files**.
- `rg --files trackmcp-nextjs/src/app/api | wc -l` -> **139 API files**.
- `rg -l -i 'supabase|NEXT_PUBLIC_SUPABASE|SUPABASE_SERVICE_ROLE' trackmcp-nextjs supabase .github docs --glob '!**/node_modules/**' --glob '!**/.next/**' | wc -l` -> **186 files with references** (broad inventory; to be narrowed by runtime role).
- `git status --short --branch` -> branch `codex/record-final-go`; the worktree contains pre-existing user changes. Those changes are being preserved and not reset.
- `command -v aws` and `command -v supabase` -> neither CLI is installed in the local shell. Cloud-console/browser inspection and repository tooling are therefore used for discovery until a CLI is intentionally added.

## Provisional architecture under evaluation

The lowest-complexity candidate is the official self-hosted Supabase Docker distribution on an x86 EC2 instance with encrypted gp3 EBS persistence, restricted ingress, HTTPS termination, IAM/SSM administration, CloudWatch monitoring, and encrypted off-instance S3 backups. The existing AWS App Runner frontend/backend remains in place and would continue to use the Supabase SDK through centralized environment variables. EC2 + RDS and Lightsail remain comparison options; no option is selected or provisioned yet.

This is provisional until current Supabase compatibility requirements, AWS pricing/credits, required services, backup requirements, and measured usage are verified.

## Approval gates

1. **Architecture/cost approval:** owner approves the selected AWS topology, region, monthly estimate at current/2x/5x usage, credit assumptions, and spending-alert plan.
2. **Staging approval:** owner authorizes creation of the isolated AWS resources needed to deploy and test staging.
3. **Migration approval:** owner authorizes a production data/auth migration after staging evidence, backup restoration evidence, and rollback criteria are complete.
4. **Cutover approval:** owner explicitly approves production DNS/credentials/live-traffic changes.

## Open blockers / unknowns

- Actual Supabase Cloud database bytes, exact egress total, file-storage bytes, Auth MAU, and historical growth are not available from the restricted read-only view.
- Storage bucket/object inventory is incomplete because the restricted project UI did not load it; source search found no application Storage calls.
- AWS Credits summary now shows $1,125.22 total remaining and $1,037.31 estimated remaining, including the $1,000 Activate Founders credit; exact credit applicability, tax treatment, and post-credit costs still require billing verification.
- Auth export compatibility, password-hash preservation, JWT signing-key/session behavior, OAuth provider secrets, and redirect allowlists require staging verification.
- AWS staging approval is recorded. The guarded workflow was merged to `main` through [PR #793](https://github.com/Krishna3956/CRV/pull/793). The isolated stack is now operating and has passed bootstrap, authenticated health, read-only inspection, and schema replay. No production or Supabase Cloud mutation is claimed.
- Schema replay initially exposed an SSM command-length truncation: the embedded remote script ended after the reset sentinel. PRs [#816](https://github.com/Krishna3956/CRV/pull/816), [#817](https://github.com/Krishna3956/CRV/pull/817), [#818](https://github.com/Krishna3956/CRV/pull/818), and [#819](https://github.com/Krishna3956/CRV/pull/819) added bounded diagnostics and moved the remote script into the private S3 bucket. Run #11 is the verified replay using that fix.
- Source export remains the next gate. The Supabase Cloud project is preserved and was not deleted, reset, or reconfigured. Public REST probes return HTTP 402 (`Egress Exceeded`); SQL Editor read-only queries still work. Do not reset the source database password or change production Auth while this gate is open.
- Public scripted probes receive a Cloudflare HTTP 403, while browser-compatible requests and the direct App Runner origin return 200; treat this as an edge policy/managed bot rule issue, not evidence that App Runner is down.

## Evidence log

| Timestamp | Phase | Evidence | Result |
|---|---|---|---|
| 2026-11-01 13:44 IST | Discovery | Repository counts and `git status` commands above | Safe discovery complete so far; no production state changed. |
| 2026-11-01 13:51 IST | Supabase Cloud billing | Authenticated Supabase Billing UI shows the `trackmcp FREE` organization is restricted because the Free-plan quota was exceeded, specifically `Egress Exceeded`. The UI displays Free limits of 50,000 MAU, 500 MB database, 5 GB egress, 5 GB cached egress, 1 GB file storage, and two projects. The exact egress byte total was not available while restricted. | VERIFIED |
| 2026-11-01 13:51 IST | Supabase hosted project | Authenticated project UI shows `EXCEEDING USAGE LIMITS` and `PRODUCTION`. Auth Users reports 54 users. Database settings show Nano compute, pool size 15, max client connections 200, SSL enforcement off, and unrestricted network access; no production settings were changed. | VERIFIED |
| 2026-11-01 13:51 IST | Optional Supabase services | Edge Functions UI shows the first-function onboarding state; Realtime inspector shows no joined application channel. Repository search found no Storage, Realtime, or Edge Function call sites. Storage bucket inventory could not be verified because the restricted project UI did not load bucket contents. | VERIFIED / PARTIAL |
| 2026-11-01 13:51 IST | AWS Activate credit | Authenticated AWS Billing Credits UI shows $1,125.22 total amount remaining and $1,037.31 total estimated amount remaining. The active `AWS Activate - FOUNDERS` credit shows $1,000 issued and remaining, expiring 2028-10-31 in the current UI; the service list includes EC2, EBS, S3, AWS Backup, Secrets Manager, Lightsail, SES, ACM, CloudWatch, Route 53, RDS, Lambda, Systems Manager, and data transfer. | VERIFIED |
| 2026-11-01 13:51 IST | Application compatibility | `supabase-js` is used through centralized environment variables. Browser/server clients use `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`; privileged routes use `SUPABASE_SERVICE_ROLE_KEY`; no `DATABASE_URL` or direct PostgreSQL client was found in the targeted application paths. Auth uses password, OTP/reset, Google/GitHub OAuth, and PKCE callback exchange. | VERIFIED |
| 2026-11-01 13:55 IST | Migration artifacts | Added `docs/aws-supabase-compatibility-matrix.md`, `docs/aws-supabase-cutover-runbook.md`, `docs/aws-supabase-backup-recovery.md`, `infra/aws-supabase/README.md`, `infra/aws-supabase/parameters.example.json`, and a non-applied `infra/aws-supabase/template.yaml`. | VERIFIED |
| 2026-11-01 13:56 IST | Repository verification | `git diff --check`; `npm run lint`; `npm run test:auth-callback`; `npm run test:apprunner-deploy-contract`; `npm run test:migration-inventory`; `npm run test:secret-scope-audit`; `npm run test:rollback-plan` all passed. No migration-specific staging test was claimed. | VERIFIED |
| 2026-11-01 13:58 IST | Architecture/cost proposal | Added `docs/aws-supabase-architecture.md` with EC2/RDS/Lightsail comparison, current/2x/5x planning envelopes, verified-credit runway, required measurements, and the first staging approval request. | READY FOR OWNER APPROVAL |
| 2026-11-01 14:00 IST | Scheduler inventory | Repository search found existing AWS Lambda/EventBridge scheduler templates for refresh and alerts, with GitHub workflows used for controlled deployment/health evidence/recovery. No Supabase Edge Function scheduler dependency was found. | VERIFIED |
| 2026-11-01 14:02 IST | Scheduler verification | `npm run test:refresh-scheduler-workflow`; `npm run test:refresh-scheduler-handler`; `npm run test:deploy-workflow-smoke`; and `npm run test:release-gate-contract` all passed. Tests confirm disabled-first, metadata-only, secret-safe scheduler behavior and bounded worker requests. | VERIFIED |
| 2026-11-01 14:05 IST | Local migration preflight | Added `trackmcp-nextjs/scripts/aws-supabase-preflight.mjs` and its contract test/package script. Executed preflight: 45 migrations, `pgcrypto` and `auth.users` references present, no executable migration references to Storage/Realtime/Edge Functions/database scheduling, all three deployment environment names present, four scheduler files identified, and `safe_to_provision=false`. Then `npm run test:aws-supabase-preflight`, `npm run lint`, and `git diff --check` passed. | VERIFIED |
| 2026-11-01 14:35 IST | Availability and custody update | Direct App Runner origin and `/api/health` return HTTP 200; browser-compatible requests to the public app return HTTP 200; default scripted curl returns Cloudflare HTTP 403 with a managed block page. Added `docs/aws-supabase-secret-inventory.md`; no production DNS, credentials, Supabase data, or traffic changed. | VERIFIED |
| 2026-11-01 14:50 IST | Owner direction and recovery order | Owner approved autonomous execution, explicitly prohibited Supabase deletion, requested Supabase remain the backup/rollback source, approved AWS resource creation, and requested website availability/authentication recovery before migration. The GitHub issue draft contains no secret values and is awaiting the final publish confirmation required by the browser action policy. | RECORDED |
| 2026-11-01 14:55 IST | AWS deployment path | AWS CloudShell was opened in the authenticated browser, but AWS returned `Unable to create the environment. Your account verification is in progress.` No resource creation was attempted through CloudShell. | BLOCKED / ALTERNATIVE REQUIRED |
| 2026-11-01 15:05 IST | Owner recovery direction | Owner directed that Supabase Cloud remain untouched and available as the backup/rollback source, requested public availability and authentication recovery before migration, authorized autonomous execution, and requested a redacted repository of key/configuration custody and change evidence. | RECORDED |
| 2026-11-01 15:05 IST | Guarded deployment commits | Pushed `05306edd` (`infra: prepare guarded AWS Supabase staging`) and `1adb6717` (`infra: harden staging reruns and credit ledger`) to `origin/codex/record-final-go`; YAML parsing and `git diff --check` pass. The workflow has an exact `PROVISION_STAGING` guard and does not mutate Supabase Cloud, production DNS, App Runner, or live traffic. | VERIFIED / PR PENDING |
| 2026-11-01 15:09 IST | Public recovery verification | Browser inspection of `https://trackmcp.com/signin` renders the sign-in form successfully. The trusted App Runner origin and `/api/health` return HTTP 200; `/api/auth/providers` returns `{"google":false,"github":false}` because production Auth is not yet available through the restricted Supabase path. Scripted public probes still receive Cloudflare HTTP 403, while the browser-compatible page is reachable. No production configuration was changed. | VERIFIED / PARTIAL |
| 2026-11-01 15:24 IST | Review and recovery issue published | Confirmed [PR #793](https://github.com/Krishna3956/CRV/pull/793) exists, is able to merge, and remains unmerged. Published [issue #794](https://github.com/Krishna3956/CRV/issues/794) with the recovery order, no-secret policy, backup requirement, and production cutover gate. | VERIFIED |
| 2026-11-01 15:40 IST | Recovery issue and merge evidence | [Issue #794](https://github.com/Krishna3956/CRV/issues/794) is published. [PR #793](https://github.com/Krishna3956/CRV/pull/793) was squash-merged to `main` as `a158ca9`; only the guarded staging workflow and documentation were included. Supabase Cloud, production DNS, App Runner configuration, and live traffic were not changed. | VERIFIED |
| 2026-11-01 15:47 IST | IAM permission correction | The existing GitHub OIDC role's inline `DeployPerms` policy was updated in AWS IAM to allow `ssm:GetParameters` against the public AL2023 AMI parameter ARN required by CloudFormation. This was the exact denial from attempt #5; no administrator policy or delete permission was added. | VERIFIED |
| 2026-11-01 15:55 IST | Isolated staging attempt #6 | GitHub Actions run `41291129816`, job `124807805793`, passed network metadata discovery, private/versioned backup bucket verification, staging secret-container verification, and CloudFormation template validation. The job was cancelled at the 60-minute timeout while the CloudFormation create/update step was still in progress; it never reached SSM or Supabase installation. The run had created/used the isolated stack path (`trackmcp-supabase-staging`, stack ID recorded in the workflow evidence); current stack resource state still requires authenticated AWS inspection. No deletion was attempted. | FAILED / PRESERVED FOR INSPECTION |
| 2026-11-02 04:34 IST | Staging schema replay diagnostics | Runs #7 (`41360254596`) and #8 (`41360626724`) confirmed the isolated public-schema reset completed but the original embedded SSM script ended before the migration sentinel. Bounded logging showed no source rows or secret values. | FAILED / DIAGNOSED |
| 2026-11-02 04:45 IST | SSM command-length fix | Run #10 (`41361250535`) confirmed the diagnosis: the remote command was truncated after `STAGING_PUBLIC_SCHEMA_RESET`; the shell trap and workflow source were present, but no later remote marker was received. The fix moved the remote script to the private backup bucket and reduced the SSM command to a short download-and-execute sequence. | VERIFIED / FIX MERGED |
| 2026-11-02 04:50 IST | Isolated staging schema replay | Run #11 (`41361605465`), job `125012953677`, completed successfully in 29 seconds from `main` commit `283ec45`. The log contains `SSM command status: Success`, `STAGING_PUBLIC_SCHEMA_RESET`, and `STAGING_SCHEMA_APPLIED`. The script's postflight query completed without printing data. | VERIFIED |
| 2026-11-02 04:52 IST | Read-only staging inspection | Run #9 (`41361733463`), job `125013335229`, completed successfully in 25 seconds. It confirms stack `trackmcp-supabase-staging-24` is `CREATE_COMPLETE`, instance `i-0eb13e22491e698d7` is `running`, SSM is `Online`, and security group `sg-0578eb9c309a6fd30` is attached. It also confirms backup bucket `trackmcp-supabase-backups-872575360367-us-east-1` is in `us-east-1`, versioning is `Enabled`, public access block is fully enabled, and AES256 server-side encryption is configured. | VERIFIED |
| 2026-11-02 05:00 IST | Source row export probe | Authenticated Supabase SQL Editor query `select id from auth.users limit 1;` timed out after approximately 27 seconds while the project remained quota-restricted. No row data was exported, no source settings changed, and no password reset was attempted. | BLOCKED / SOURCE ACCESS |
| 2026-11-02 05:15 IST | Source export readiness | Added the guarded manual workflow `.github/workflows/export-supabase-source.yml` and `docs/aws-supabase-source-export.md`. It requires the repository secret `SUPABASE_SOURCE_DB_URL`, enforces TLS, performs `pg_isready` and a read-only custom-format `pg_dump`, and uploads only to the existing private/versioned AES-256 S3 backup bucket. No source connection was attempted because the secret is not present. | VERIFIED / READY WHEN SOURCE ACCESS EXISTS |
| 2026-11-02 09:05 IST | CI release-gate repair discovered during PR #822 | The repository release gate exposed that the read-only migration-parity manifest omitted the merged `20260828000000_mcp_tools_baseline` migration in both expected-value lists. Added the missing entry to `supabase/manual/founder-os-migration-parity-postflight.sql`; the parity contract passed and the full release gate passed with 155 suites. | VERIFIED |

