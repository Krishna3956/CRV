# First-100-customer external-gate register

Status: **HOLD**  
Updated: 2026-10-27 (Asia/Calcutta)

This register separates evidence that engineering can produce from decisions
that require the release owner or an infrastructure-provider control plane. It
is intentionally not a GO approval and must not be treated as one.

## Engineering baseline

- `main`: current default branch. Immutable deployed SHAs belong in the
  release record; PR checks remain attached to their exact review commits.
- Current deployed application: `0c36da187d6fee56cd280ea79070176e9cd8f63d`,
  App Runner workflow `40426236860` (successful deployment, production smoke,
  release-identity verification, runtime safety-flag audit, and redacted
  evidence uploads). The AWS console showed `trackmcp-web` Running after the
  deployment. Subsequent docs-only commits are intentionally not called runtime
  deployments because they do not change the application image.
- Queue: 263 total, 260 checked, and P0 queue items `020`, `157`, and `260`
  remain open.
- Full local release gate: 137 suites passed, with lint and the production
  build green.
- Authenticated device-flow UAT covers expired, denied, multiple-membership,
  and zero-membership workspace creation without browser key disclosure.
- Authenticated production scope smoke `40429116070` passed against immutable
  commit `5e26564ad446f11f712de66cf0594a0b803a7d70`; its redacted artifact
  covered key status, conflicting-workspace isolation, Founder OS v2 and
  legacy read models, API-key Action Queue denial, revoked-key rejection, and
  privacy-safe projections. It was read-only and did not create, rotate,
  revoke, ingest, or mutate dashboard state.
- Rollback and authenticated scope-smoke evidence are reconciled in the
  release record through queue items 256 and 249.
- Scheduler deployment history is retained: disabled run `40397368253` failed
  closed before provisioning when App Runner redacted the runtime mapping, and
  retry `40398170070` reproduced that boundary. The later successful
  disabled-first deployment is recorded below as `40423356750` after the
  non-sensitive Secrets Manager ARN fallback was supplied.

## Gates requiring external evidence

| Gate | Accountable party | Evidence required to close | Current state |
| --- | --- | --- | --- |
| 020 — limited pilot scope | Release owner | Timestamped approval naming the 100-customer cohort, supported hosts and paths, known limitations, rollback owner, and data-handling boundary | OPEN; the release record remains Draft/HOLD |
| 157 — database recovery posture | Infrastructure/provider owner | Region and tier, backup/PITR policy or an explicitly accepted limitation, restoration owner, and a tested recovery reference | OPEN; authenticated Supabase inspection records Free tier, East US/`us-east-1`, Nano/shared compute, and PITR **Disabled**. A fresh signed-in browser inspection of Database → Backups (2026-10-27) showed no usable scheduled-backup or restore-point evidence. No restoration contact or rehearsal is evidenced. |
| Privacy lifecycle acceptance | Release owner | Explicit acceptance that export is bounded/secret-free, deletion requests are review-only, and destructive deletion is disabled without an approved worker | OPEN in the release record |
| Synthetic reliability-data hygiene | Release owner | Explicit acceptance that synthetic canary rows are test evidence only and cannot be presented as customer incidents | OPEN in the release record |
| Refresh scheduler enablement | Infrastructure/provider owner | Store `TRACKMCP_REFRESH_WORKER_SECRET` in Secrets Manager, map the App Runner runtime variable from that ARN, deploy the disabled-first AWS Scheduler stack, verify endpoint/token/log/DLQ behavior, enable the five-minute schedule, and retain at least three scheduled samples within the 15-minute freshness budget | OPEN for scheduler enablement. On 2026-10-27 the worker token was stored in the existing replicated `RuntimeEnvironmentSecrets` bundle (primary us-east-1, replica ap-south-1), and App Runner update completed successfully with the JSON key ARN visible in the Running service configuration. The standalone-secret mapping rolled back. After attaching `TrackMCPRefreshSchedulerDeploy` to `GitHubActionsDeployRole` and adding only the observed CloudFormation/SAM actions, disabled-first run `40423356750` succeeded on main `28f1b53`; the stack is up to date and the schedule resource is present but disabled because `EnableSchedule=false`. Direct probes against the deployed App Runner refresh endpoint returned HTTP 401 for both unauthenticated and invalid-token requests. No authenticated Lambda/log/DLQ smoke, enabled AWS schedule, or scheduled-sample evidence exists |
| 260 — final go/no-go | Release owner | Timestamped GO/NO-GO decision linking the green evidence and accepted limitations | OPEN; engineering recommendation remains HOLD |

## Closure rule

Engineering may add evidence, tests, or implementation, but must not check any
row above merely because source tests are green. A gate becomes closed only
when the named evidence is retained in the release record and the acceptance
contract still passes. Until then, customer-facing readiness claims remain
unapproved.
