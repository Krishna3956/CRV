# First-100-customer external-gate register

Status: **HOLD**  
Updated: 2026-10-27 (Asia/Calcutta)

This register separates evidence that engineering can produce from decisions
that require the release owner or an infrastructure-provider control plane. It
is intentionally not a GO approval and must not be treated as one.

## Engineering baseline

- `main`: current default branch. Immutable deployed SHAs belong in the
  release record; PR checks remain attached to their exact review commits.
- Current deployed application: `f81317d9875dab0f48fb21bd0adfa76011b76baf`,
  App Runner workflow `40472509165` (successful rollout, production smoke,
  immutable identity, runtime-safety audit, and three redacted artifacts).
  The latest rollout has not been represented as a new authenticated
  key-lifecycle UAT run. This is the runtime reference for release review.
- Current source verification: `main` at `4c82f72` (ledger evidence update),
  with the deployed application at the immutable `f81317d` candidate above.
  This does not close the external owner, backup, privacy, or scheduler-cadence
  gates.
- Historical deployed baseline retained for audit: `9638e23c8529f9b1781d96413529e33a692715ed`,
  App Runner workflow `40468547762`.
- Queue: 263 total, 260 checked, and P0 queue items `020`, `157`, and `260`
  remain open.
- Full local release gate: **143 suites passed**, with lint and the 177-route
  production build green.
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
| Refresh scheduler enablement | Infrastructure/provider owner | Store `TRACKMCP_REFRESH_WORKER_SECRET` in Secrets Manager, map the App Runner runtime variable from that ARN, deploy the disabled-first AWS Scheduler stack, verify endpoint/token/DLQ behavior, enable the five-minute schedule, and retain at least three scheduled samples within the 15-minute freshness budget | OPEN for sustained cadence evidence. Scheduler deployment `40466761616` succeeded with the EMF/failure-class Lambda, health run `40467394730` / artifact `12717320479` observes 4 scheduled-success samples and 0 scheduled-failure samples, and push-triggered auto-redeploy run `40470584190` completed successfully with scheduling disabled. One Lambda error remains in the rolling AWS invocation window, so the stricter zero-error cadence gate remains open until a clean window is retained. |
| 260 — final go/no-go | Release owner | Timestamped GO/NO-GO decision linking the green evidence and accepted limitations | OPEN; engineering recommendation remains HOLD |

## Closure rule

Engineering may add evidence, tests, or implementation, but must not check any
row above merely because source tests are green. A gate becomes closed only
when the named evidence is retained in the release record and the acceptance
contract still passes. Until then, customer-facing readiness claims remain
unapproved.
