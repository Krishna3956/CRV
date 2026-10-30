# First-100-customer external-gate register

Status: **GO — controlled first-100 pilot**
Updated: 2026-10-30 (Asia/Calcutta)

This register separates evidence that engineering can produce from decisions
that require the release owner or an infrastructure-provider control plane.
The current decision is a bounded GO for the controlled first-100 pilot; it is
not an unbounded public-launch approval.

## Final release-owner GO — 2026-10-30

The release-owner approval is retained verbatim:

> FINAL GO — I approve TrackMCP for a controlled first-100-customer pilot as of 2026-10-30, accepting metadata-only telemetry, manual/disabled-first alerting, Supabase Free-plan logical-export-only recovery with PITR disabled, the release owner as rollback/restoration owner, and the documented UAT/protocol limitations. This is a controlled pilot approval, not an unbounded production guarantee.

The release owner authorizes a controlled first-100-user pilot based on the
evidence below and accepts the following explicit boundaries:

- The formal customer-owned test endpoint UAT passed in guarded GitHub Actions
  workflow `41049662323` from merged `main` commit `2365106b`. The endpoint is
  an operator-owned AWS test service, so this proves the durable HTTPS MCP
  execution path and reviewed protocol surface, not interoperability with
  every possible third-party MCP server.
- The current engineering baseline remains 155 passing suites and a
  211-route production build; health run `41038856612` is healthy with four
  scheduler invocations, four scheduled successes, four complete worker
  samples, zero worker failures/retries/parse failures, and current maximum
  queue lag within the 15-minute budget.
- Telemetry is metadata-only: tool arguments, resource bodies, prompt values,
  credentials, and raw payloads are not retained. Alerting is manual or
  disabled-first during the pilot.
- Supabase Free-plan recovery is accepted as a pilot limitation: logical
  export only, PITR disabled, and no guaranteed RPO/RTO. The release
  owner/project operator owns rollback and restoration; the recovery contact
  is `krishnaatmu@gmail.com`. The documented follow-up is 2026-11-30 before
  any expansion beyond the pilot.
- Partial protocol surfaces, OAuth exchanges, replay/reconnect semantics, and
  destructive deletion remain outside the supported first-100 claim unless
  separately evidenced. Synthetic data is test evidence only.

This decision changes the current release status to GO for the bounded pilot.
Any expansion beyond these limits requires a new evidence and approval cycle.

## Engineering baseline

- `main`: current default branch. Immutable deployed SHAs belong in the
  release record; PR checks remain attached to their exact review commits.
- Current deployed application runtime:
  `177165180383e31bb7760040469f9aaa7f78f8a1`. App Runner workflow
  `41013186081` passed rollout, release gate, read-only production smoke,
  runtime-safety, translation-provider, and release-identity checks; the
  direct-origin health probe confirmed the exact runtime SHA. Authenticated
  production smoke `41014068784` also passed for that deployed revision.
- Current source verification: `main` at documentation-only tip
  `dfcdb30f75f97df1c94f2adb1f0b67964c2376eb`. The deployed application code
  remains the merged application revision above. Main CI `41025977624` passed
  all hosted lanes. The full local release gate
  passes 155 suites and the production build generates 211 routes. Read-only
  auth smoke `40893382834`, direct first-ingest `40894964464`, and
  SDK-shaped public-edge first-ingest `40896249223` are recorded in the
  readiness ledger. This does not close the external owner, backup, privacy,
  credentialed lifecycle, OAuth provider, or customer-owned protocol gates.
- Historical deployed baselines retained for audit include `9638e23c8529f9b1781d96413529e33a692715ed`
  (App Runner workflow `40468547762`) and `37579eade74a20818cd4f83569493e830e4855de`
  (App Runner workflow `40474794151`), plus the earlier deployment identity
  `4efa2e1bd444706e84d78ef85b8a7b3b133a46aa` and workflow `40497434962`
  retained by the acceptance contract.
- The older `b98c6f41` rollout remains historical evidence. This register does
  not change the external owner, backup, privacy, or customer-owned protocol
  decisions.
- Refresh queue postflight after the schema repair reports
  `queued=0`, `running=0`, `retryable=0`, and `failed=0`, with `16883`
  succeeded jobs. Fresh health run `41038856612` is `healthy`: it records four
  AWS scheduler invocations, zero errors, four end-to-end scheduled successes,
  four complete worker samples, zero worker failures/retries/parse failures,
  and current worker max queue lag `832835ms` within the `900000ms` budget.
  The AWS scheduler cadence, AWS end-to-end cadence, and worker-freshness gates
  are proven; historical cadence breaches remain visible outside the current
  clean evaluation window.
- Full release gate: **155 suites passed**, with lint and the 211-route
  production build green (the prior 209/177-route baselines remain retained in
  historical evidence).
- Authenticated device-flow UAT covers expired, denied, multiple-membership,
  and zero-membership workspace creation without browser key disclosure.
- Authenticated production scope smoke `40429116070` passed against immutable
  commit `5e26564ad446f11f712de66cf0594a0b803a7d70`; its redacted artifact
  covered key status, conflicting-workspace isolation, Founder OS v2 and
  legacy read models, API-key Action Queue denial, revoked-key rejection, and
  privacy-safe projections. It was read-only and did not create, rotate,
  revoke, ingest, or mutate dashboard state.
- Authenticated production smoke `40475627480` also passed for the deployed
  `37579ea` candidate; retained redacted artifact
  `production-auth-smoke-37579eade74a20818cd4f83569493e830e4855de`
  reverified dashboard read models, tenant/workspace isolation and conflict
  handling, API-key mutation denial, and revoked-key rejection. This remains
  read-only evidence and does not close first-ingest, transport, or
  customer-endpoint UAT. A separate terminal-only disposable production run
  has since verified workspace/key creation, rotation, old-key rejection,
  replacement acceptance, replacement revocation, and post-revocation
  rejection; it did not claim customer-owned endpoint interoperability. A
  separate terminal-only device activation and first-event UAT now verifies
  the browser-approval/CLI-redemption path with a disposable key; it does not
  change the customer-owned endpoint or protocol boundary.
- A manual-only `customer-endpoint-uat.yml` workflow now accepts one
  operator-supplied HTTPS endpoint and reviewed MCP transport/version, runs a
  bounded initialize plus catalog-discovery pass through the official client,
  and uploads only a mode-0600 redacted report. It rejects unsafe targets,
  cross-origin redirects, arbitrary tool calls, and implicit OAuth flows. The
  harness improves the evidence path but does not close this gate until a
  credentialed customer endpoint run is executed and accepted. The
  repository-level Actions secret inventory checked on 2026-10-30 contains the
  refresh-worker secrets but does not contain
  `TRACKMCP_CUSTOMER_ENDPOINT_UAT_KEY` or
  `TRACKMCP_CUSTOMER_ENDPOINT_UAT_AUTH_TOKEN`; an operator must provision
  those disposable credentials before the guarded workflow can run.
- Rollback and authenticated scope-smoke evidence are reconciled in the
  release record through queue items 256 and 249.
- Scheduler deployment history is retained: disabled run `40397368253` failed
  closed before provisioning when App Runner redacted the runtime mapping, and
  retry `40398170070` reproduced that boundary. The later successful
  disabled-first deployment is recorded below as `40423356750` after the
  non-sensitive Secrets Manager ARN fallback was supplied.
- Alert evaluation deployment path is now implemented in
  `.github/workflows/deploy-alert-scheduler.yml` with manual invocation,
  disabled-first defaults, opt-in metadata-only smoke/evidence, and no secret
  value retrieval. Production alert enablement remains an external HOLD until
  a dedicated worker-token ARN, canary workspace/destination, and accepted
  delivery evidence are supplied.

## Gates requiring external evidence

| Gate | Accountable party | Evidence required to close | Current state |
| --- | --- | --- | --- |
| 020 — limited pilot scope | Release owner | Timestamped approval naming the 100-customer cohort, supported hosts and paths, known limitations, rollback owner, and data-handling boundary | **CLOSED for controlled first-100 pilot:** final GO records the cohort boundary, supported HTTPS MCP discovery path, metadata-only retention, manual/disabled-first alerting, rollback/restoration owner, contact, and accepted limitations. |
| 157 — database recovery posture | Infrastructure/provider owner | Region and tier, backup/PITR policy or an explicitly accepted limitation, restoration owner, and a tested recovery reference | **CLOSED for controlled first-100 pilot as an accepted limitation:** Free tier, East US/`us-east-1`, Nano/shared compute, PITR **Disabled**, logical-export-only recovery, no guaranteed RPO/RTO, and rollback/restoration owner `krishnaatmu@gmail.com` / release owner. Evidence: `docs/evidence/supabase-backup-acceptance-2026-10-30.md`. This is not a provider backup/PITR claim; upgrade or restore rehearsal is required before expanding beyond the pilot. |
| Privacy lifecycle acceptance | Release owner | Explicit acceptance that export is bounded/secret-free, deletion requests are review-only, and destructive deletion is disabled without an approved worker | **DECISION RECORDED:** metadata-only telemetry boundary and review-only deletion posture accepted for the controlled pilot. |
| Synthetic reliability-data hygiene | Release owner | Explicit acceptance that synthetic canary rows are test evidence only and cannot be presented as customer incidents | **DECISION RECORDED:** synthetic evidence accepted as test evidence until durable customer-owned UAT; it must not be presented as a customer incident. |
| Refresh scheduler enablement | Infrastructure/provider owner | Store `TRACKMCP_REFRESH_WORKER_SECRET` in Secrets Manager, map the App Runner runtime variable from that ARN, deploy the disabled-first AWS Scheduler stack, verify endpoint/token/DLQ behavior, enable the five-minute schedule, and retain at least three scheduled samples within the 15-minute freshness budget | **PROVEN for current health:** health run `41038856612` records four AWS scheduler invocations, zero errors, four end-to-end scheduled successes, four complete worker samples, zero worker failures/retries/parse failures, and current worker max queue lag `832835ms` within the `900000ms` budget. Historical cadence breaches remain visible outside the current clean evaluation window. |
| Credentialed key lifecycle mutation | Engineering | Disposable workspace/key create, active-key rotation, old-key rejection, replacement acceptance, replacement revocation, and post-revocation rejection | **PROVEN:** terminal-only disposable production UAT on 2026-10-28 completed the status checks; both disposable credentials ended revoked. This does not prove customer-owned endpoint interoperability. |
| TrackMCP account OAuth providers | Engineering + release owner | Supabase providers enabled, exact callback configuration, real sign-in, existing-user dashboard return, onboarding and device-flow return-path checks | **CLOSED for bounded pilot with an explicit limitation:** GitHub and Google existing-user dashboard returns are proven, including the Google flow using `krishnaatmu@gmail.com`. New-user onboarding and device-flow return-path coverage beyond the exercised existing-user path remain outside the pilot claim and require evidence before expansion. |
| 260 — final go/no-go | Release owner | Timestamped GO/NO-GO decision linking the green evidence and accepted limitations | **CLOSED — GO for controlled first-100 pilot:** final release-owner decision links workflow `41049662323`, health run `41038856612`, the accepted backup limitation, privacy boundary, rollback/restoration owner, and bounded protocol scope. This is not an unbounded production guarantee. |

The isolated AWS deployment and bounded endpoint UAT are now evidenced by
`docs/evidence/customer-owned-endpoint-uat-aws-2026-10-30.md` and its redacted
JSON report. This closes the operator-supplied AWS execution path; it does not
close the independent customer-owned interoperability gate.

The guarded workflow execution is independently retained by GitHub Actions run
`41049662323`. The backup/recovery decision is retained by
`docs/evidence/supabase-backup-acceptance-2026-10-30.md`.

## Closure rule

Engineering may add evidence, tests, or implementation, but must not check any
row above merely because source tests are green. A gate is closed for this
pilot only when the named evidence is retained in the release record, the
acceptance contract still passes, and the final GO explicitly bounds the
claim. Customer-facing claims remain limited to the controlled first-100
pilot; expansion requires new evidence and approval.
