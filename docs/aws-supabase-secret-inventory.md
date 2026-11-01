# TrackMCP secret and key inventory

This is a redacted custody ledger. It intentionally contains names, purposes, owners, storage locations, and rotation evidence only. Secret values, passwords, OAuth client secrets, private keys, JWT signing secrets, API tokens, and service-role keys must never be committed here or into any issue.

Last reviewed: 2026-11-01

## Rules

- Keep the current Supabase Cloud project and its credentials available until the rollback window ends.
- Never copy a production secret into staging unless the migration owner explicitly approves the specific secret and destination.
- Store runtime secrets in AWS Secrets Manager or the existing protected provider secret store; use IAM roles rather than long-lived AWS access keys.
- Record rotation timestamps and secret-manager references, not secret contents.
- Treat any secret pasted into browser notes, issues, logs, chat, or a public repository as exposed and rotate it.
- After migration, retain a sealed, access-controlled recovery copy of the source configuration until rollback is closed; do not delete the source project.

## Inventory

| Secret/configuration | Used by | Current custody | Destination custody | Rotation / verification |
|---|---|---|---|---|
| Supabase Cloud project URL | Browser/server SDK and Auth | Existing deployment configuration and protected build/runtime settings | New self-hosted HTTPS API origin, after staging | Verify all app, worker, CI, and OAuth callback references before cutover |
| Supabase publishable/anon key | Browser/server SDK | Protected build configuration; public by design but still environment-managed | Newly generated/configured destination publishable key | Verify browser only receives publishable key; never use service-role key client-side |
| Supabase Cloud service-role key | Trusted App Runner routes/workers | Protected App Runner runtime secret bundle | Newly generated destination service-role key in a separate staging/prod secret | Rotate after destination validation; never print or commit |
| Supabase Auth JWT/signing configuration | Auth token verification and session continuity | Supabase-managed/cloud configuration; exact value not recorded | New self-hosted JWT configuration | Plan session invalidation/reauthentication unless staging proves compatibility |
| Google OAuth client secret | Supabase Auth provider | Supabase Auth provider configuration | Self-hosted Auth provider configuration | Reconfigure callback/secret; verify login and denial paths |
| GitHub OAuth client secret | Supabase Auth provider | Supabase Auth provider configuration | Self-hosted Auth provider configuration | Reconfigure callback/secret; verify login and denial paths |
| SMTP credentials | Auth verification/reset email | Provider configuration or protected secret store | AWS SES/approved SMTP secret | Verify sending domain, From address, reset, and verification flows |
| TrackMCP application secrets | App Runner API routes/workers | Existing AWS Secrets Manager bundle | Existing bundle plus destination-specific references as needed | Inventory names/ARNs only; rotate only when a dependency is proven |
| Refresh/alert worker tokens | Lambda/EventBridge to App Runner | AWS Secrets Manager references used by existing workflows | Keep existing scheduler custody; create separate staging tokens | Verify disabled-first and no token exposure in logs |
| GitHub Actions OIDC/IAM role | CI deployment workflows | GitHub OIDC and AWS IAM role | Keep least privilege; no static key required | Verify trust policy/repository scope before staging deploy |
| Database logical export encryption key | Backup artifacts | Not yet created for AWS migration | AWS KMS/S3 encryption under approved account policy | Create before first AWS export; restore-test the encrypted artifact |

## Change record

| Date | Change | Evidence | Production impact |
|---|---|---|---|
| 2026-11-01 | Added this redacted inventory and prohibited secret values in issue/ledger artifacts | Local review and `git diff --check` | None |
| 2026-11-01 | No Supabase Cloud credentials, DNS, OAuth settings, or production traffic changed during migration discovery | Migration ledger and live probes | None |

## Required before cutover

- Confirm the source backup/export artifact exists and can be restored.
- Create separate staging and production destination secrets.
- Reconfigure and test Google/GitHub OAuth on staging.
- Decide the session transition and communicate reauthentication if required.
- Rotate any credential found in browser notes, chat, issues, logs, or another uncontrolled location before using it for production.
- Record secret-manager references and rotation timestamps in this document without recording values.
