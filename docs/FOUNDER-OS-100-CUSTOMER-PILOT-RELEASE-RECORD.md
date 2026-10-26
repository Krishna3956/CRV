# Founder OS 100-customer pilot release record

Status: **Draft — not yet a go decision**

This record is intentionally evidence-first. It must not be changed to
`GO` until the open gates below are independently verified on the release
commit and the operator accepts the listed limitations.

## Current evidence reconciliation — 2026-10-26

The current deployed application is `4e0f5f017cae40524ff95eb28f2b394a16394c81`.
App Runner workflow `40309832613` completed successfully; the
deployment uploaded `production-smoke-4e0f5f017cae40524ff95eb28f2b394a16394c81`,
`runtime-flags-4e0f5f017cae40524ff95eb28f2b394a16394c81`, and
`app-runner-host-4e0f5f017cae40524ff95eb28f2b394a16394c81`. Authenticated
production smoke workflow `40310764833` also passed and uploaded
`production-auth-smoke-4e0f5f017cae40524ff95eb28f2b394a16394c81`.
The prior App Runner workflow `40307943718` completed successfully; the
first rollout smoke saw a transient root HTTP 503 and was not accepted. The
successful rerun uploaded production smoke artifact `12632674955` and
runtime-flags artifact `12634200409`. The onboarding pointer-affordance fix is
therefore deployed and runtime-verified. The older `be963896...` references
below are retained as historical evidence only and do not identify the current
release.

The current mainline candidate is now deployed and identity-verified. Merge
commit `be9638965383841ee7579ae9155c0162bb626495` passed App Runner workflow
`40277566836`, including image digest verification, provider rollout,
direct-origin read-only production smoke, `/api/health` SHA verification, and
runtime safety-flag audit. The redacted smoke artifact recorded 34 of 36
checks; two credentialed checks were intentionally skipped because no
production key was supplied. This closes the deployment-evidence gap for the
current candidate; it does not close credentialed ingest, key lifecycle,
authenticated dashboard mutation, worker-SLO, rollback, or intentionally
partial protocol gates.

Historical baseline reference retained for audit continuity: application
commit `2e135f194f36e278232c6a46890b1ce850d1e9ba` and App Runner run
`40198791603` describe the prior verified pilot runtime, not the current
candidate.

The automatic authenticated production smoke [workflow
40237513202](https://github.com/Krishna3956/CRV/actions/runs/40237513202)
completed successfully for the prior `68d83a3d…` deployed application SHA.
Its redacted artifact is retained as historical authenticated evidence; it
does not establish current-release authenticated read-model state, perform
write-gated key lifecycle mutation, or prove continuous worker freshness.

The guarded authenticated read-only smoke [workflow
40234566034](https://github.com/Krishna3956/CRV/actions/runs/40234566034)
completed successfully with 37 redacted checks: 34 expected authenticated
read successes across two disposable workspaces and all Founder OS v2 read
models, plus intentional 403 Action Queue API-key denials and a 401 revoked-key
denial. This closes the read-only scope/privacy smoke gate.

The earlier workflow checked out and labeled source SHA
`21b2a9d676576a51b98902595ea4322fd814b6d5`, but the merge-triggered App Runner
run for that SHA became a stale GitHub run with no job record and was canceled.
The public origin's runtime identity was therefore not proven to be that SHA;
that historical smoke is current-origin UAT plus source-contract evidence, not
deployment proof. The release remains Draft/HOLD.

The guarded write-gated key-lifecycle smoke [workflow
40234733862](https://github.com/Krishna3956/CRV/actions/runs/40234733862)
completed its preflight but skipped mutations because disposable lifecycle
cookie/workspace/key secrets were not configured. No production key was
created, rotated, or revoked.

The current-release authenticated read-only smoke [workflow
40280160295](https://github.com/Krishna3956/CRV/actions/runs/40280160295)
ran against the deployed `be963896...` release and completed successfully.
Its redacted artifact `production-auth-smoke-be9638965383841ee7579ae9155c0162bb626495`
contains 37 checks: both workspace key-status responses, conflicting-workspace
resistance, every Founder OS v2 and legacy analytics read model, API-key Action
Queue denials, and revoked-key rejection. This closes current-release
read-only tenant-scope evidence; it does not perform ingest or key lifecycle
mutation.

The guarded current-release first-ingest smoke [workflow
40281259523](https://github.com/Krishna3956/CRV/actions/runs/40281259523)
completed successfully after a transient 503 retry. Its redacted artifact
recorded exactly one bounded metadata-only event accepted with HTTP 200 and a
follow-up key-status response with `accepted_telemetry=true`. No key, event ID,
workspace ID, response body, or authorization material was retained. This
closes transport acceptance and the first-ingest milestone for the current
release; CLI activation, business-workflow completion, and key lifecycle
mutation remain separate gates.

The current guarded key-lifecycle workflow
[40282004222](https://github.com/Krishna3956/CRV/actions/runs/40282004222)
completed its preflight and intentionally skipped mutations because the four
dedicated disposable lifecycle secrets are not configured:
`TRACKMCP_LIFECYCLE_COOKIE`, `TRACKMCP_LIFECYCLE_WORKSPACE_ID`,
`TRACKMCP_LIFECYCLE_KEY_ID`, and `TRACKMCP_LIFECYCLE_KEY`. No production key
was created, rotated, revoked, or written to an artifact.

## Release identity

| Item | Verified value |
| --- | --- |
| Pilot scope | First 100 customers, desktop dashboard boundary |
| Production hosts | `trackmcp.com`, `app.trackmcp.com` |
| Last deployed application commit | `084a8e4d0165231f9998441c0e9d2611771a937d` (identity-verified current candidate) |
| Last successful App Runner deployment | `40307943718` |
| Readiness ledger | `docs/FOUNDER-OS-100-CUSTOMER-READINESS-LEDGER.md` |
| Current release-record change | Current mainline reconciliation of deployed runtime and release-gate evidence |

## Verified gates

- [x] Founder OS tabs 1–6 have bounded authenticated production assertions from the prior live release inspection; these are retained as historical evidence and do not replace the current credentialed smoke.
- [x] App Runner release gate, image build, rollout, readiness, HTTPS, and
  read-only production smoke passed for the deployed commit.
- [x] Bounded production load passed: 120/120 requests, zero errors and
  timeouts, tenant isolation passed, p95 2.11 seconds against the 3-second
  pilot budget.
- [x] Refresh worker five-slice checkpoint passed with zero retryable/failed
  results and an empty queued/running/retryable postflight at the checkpoint.
- [x] Refresh-worker recovery was exercised against the current release: scheduled
  run [40169356835](https://github.com/Krishna3956/CRV/actions/runs/40169356835)
  returned five unparseable origin responses and no processed work; manual rerun
  [40171850037](https://github.com/Krishna3956/CRV/actions/runs/40171850037)
  completed successfully. Two additional serialized recovery runs
  [40171999599](https://github.com/Krishna3956/CRV/actions/runs/40171999599) and
  [40172003995](https://github.com/Krishna3956/CRV/actions/runs/40172003995)
  also completed successfully. This closes the immediate incident but not a
  continuous scheduled-worker SLO gate.
- [x] Tab 6 synthetic canary incidents are visibly labeled as test evidence
  and are not counted as customer health claims.
- [x] Read-only retention dry run found no eligible rows in the configured
  event, fact, or action-queue retention datasets.
- [x] Privacy request and deletion-batch tables exist, deny browser-role
  `SELECT`, and deletion-batch indexes are present.
- [x] Local privacy, deletion-plan, accessibility, tenant-isolation,
  analytics, package-consumer, and pilot contract suites passed.
- [x] Local full release gate passed on the current source: 136 suites,
  including the six-tab dashboard contract (58 tests), OTLP/HTTP JSON and
  protobuf interoperability, package consumers, privacy, tenant isolation,
  protocol fixtures, and release-control contracts. This is source evidence;
  it does not replace credentialed production UAT.
- [x] Read-only production postflight for task-transition durability passed in
  the signed-in Supabase SQL editor: `trackmcp_task_transitions` exists with
  RLS enabled, 9 columns, 4 indexes, browser-role `SELECT` denied, and the
  service-role result set confirmed `SELECT`/`INSERT` allowed. No rows or task
  payloads were queried.
- [x] Manual authenticated dashboard UAT on 2026-10-24 reached all Founder OS
  surfaces and inspected Setup, including scope state, first-event evidence,
  SDK/documentation CTAs, identity-resolver guidance, privacy disclosures, and
  key lifecycle controls. No credentials, workspace IDs, or key values were
  recorded.
- [x] Current-release read-only authenticated tenant-scope smoke passed on
  2026-10-26 in workflow `40280160295` against
  `be9638965383841ee7579ae9155c0162bb626495`. Its redacted artifact
  `production-auth-smoke-be9638965383841ee7579ae9155c0162bb626495` contains 37
  checks covering both key-status responses, conflicting-workspace resistance,
  every Founder OS v2 read model, legacy analytics/tool-quality/traces
  projections, API-key denial for Action Queue mutations, and revoked-key
  rejection. It contains no keys, workspace identifiers, or response bodies;
  ingest and key lifecycle mutation remain separate gates.
- [x] A bounded first-event smoke passed on 2026-10-25 against
  `https://app.trackmcp.com` using a disposable workspace key: one
  metadata-only event was accepted with HTTP 200 and the subsequent key-status
  response reported `accepted_telemetry=true`, `first_event_accepted=true`,
  `workspace_available=true`, and `service_available=true`. The redacted report
  is `/tmp/trackmcp-production-smoke-2026-10-25-fixed3.json`; no event ID,
  credential, workspace ID, or response body was recorded.
- [x] The authenticated owner dashboard rotated the pilot key labelled
  `uat-device-2026-10-25` on 2026-10-25. The prior key is revoked and a
  replacement is active; the replacement secret was not recorded. This proves
  the dashboard mutation path, not server adoption of the replacement.
- [x] The production migration execution record is retained with migration
  `20261025000001_migration_execution_ledger`, timestamp `2026-10-25 13:23:09
  UTC`, and operator `codex-autonomous-release`.

## Open gates before GO

- [x] The current deployed engineering baseline is identified as
  `be9638965383841ee7579ae9155c0162bb626495`. App Runner run `40277566836`
  passed the exact-SHA deployment-health wait, read-only production smoke,
  immutable runtime-identity check, runtime-safety audit, and redacted
  evidence uploads. This is engineering verification; it is not the
  operator's final GO decision.
- [ ] Privacy lifecycle behavior is reviewed for the pilot: export remains
  bounded and secret-free; deletion requests are review-only; destructive
  deletion remains disabled unless a separately approved worker exists.
- [ ] The stale synthetic reliability data is explicitly accepted as test
  evidence in the pilot data-hygiene decision; it must not be presented as a
  customer incident.
- [x] Rollback rehearsal and authenticated production smoke are evidenced for
  the prior release candidate in workflows
  [40170438059](https://github.com/Krishna3956/CRV/actions/runs/40170438059),
  [40170901810](https://github.com/Krishna3956/CRV/actions/runs/40170901810),
  and [40169807874](https://github.com/Krishna3956/CRV/actions/runs/40169807874),
  but those runs targeted `aecbe2e80ca237cb2a61340c7199f069587bdb39` rather
  than the current deployed baseline. Queue item 256 records the
  release-specific rollback and restoration workflows as passed; this row is
  retained as historical candidate evidence, not an additional open gate.
- [x] A fresh credential-free production smoke is available for the current
  deployed SHA. Its artifact is
  `production-smoke-be9638965383841ee7579ae9155c0162bb626495`; it records 34
  executed read-only checks and no secret, workspace identifier, or payload.
  Current-release read-only tenant/read-model evidence is now recorded by
  workflow `40280160295`; credentialed ingest and key lifecycle remain open.
- [x] Current-release first-ingest evidence is recorded by workflow
  `40281259523`: one metadata-only event returned HTTP 200 with `accepted=1`
  and key-status returned HTTP 200 with `accepted_telemetry=true` after the
  transient 503 retry. The redacted artifact contains no credentials or event
  payload.
- [x] Historical disposable-workspace key-lifecycle evidence is retained in the
  readiness ledger, and the owner-dashboard rotation mutation is now evidenced
  on the current pilot account. The direct App Runner smoke returned HTTP 200
  before key revocation and HTTP 401 after service-role revocation; the browser
  rotation proved the owner mutation path without exposing key material. Server
  adoption of the replacement remains unclaimed.
- [ ] A final operator go/no-go decision is recorded with UTC timestamp and
  accepted limitations. The engineering recommendation remains **HOLD** until
  credentialed UAT, migration/rollback ownership, worker freshness, and the
  remaining protocol interoperability gates are evidenced or explicitly
  accepted by the release owner.
- [ ] Database backup posture remains open: authenticated Supabase inspection
  on 2026-10-26 records the Free tier, region `us-east-1` (East US/North
  Virginia), Nano/shared compute, and the Add-ons surface explicitly showing
  PITR **Disabled**. No restore point, restoration contact, or completed
  restore rehearsal is evidenced. The pilot must keep this as an explicit
  operational limitation until an owner records and accepts it.

### Distributed rate-limit IAM evidence

The guarded enablement workflow [40220255833](https://github.com/Krishna3956/CRV/actions/runs/40220255833)
completed successfully after the resource-scoped IAM policy was applied. Its
App Runner update and postflight verified `TRACKMCP_RATE_LIMIT_MODE=supabase`
live on the production service. The final policy grants only
`apprunner:UpdateService` on that service and `iam:PassRole` on the existing
App Runner ECR access role; the checked-in artifact and contract test preserve
that boundary.

Distributed multi-instance limiting is therefore an evidenced pilot capability
for the verified service. The process-local limiter remains the documented
fallback when distributed mode is unset or unavailable; neither fallback path
is presented as cross-instance protection without corresponding runtime
evidence.

## Known limitations to disclose

- Resolver-linked telemetry is not a count of named people or customers.
- Outcomes remain `N/A` when explicit workflow terminal evidence is absent;
  activity does not become a success claim.
- Cross-server journey correlation and business-task completion are bounded
  and may remain unknown.
- Synthetic canary reliability rows are retained for test evidence and are
  excluded from customer-health interpretation.
- Privacy deletion is a reviewed, non-destructive request path in this pilot;
  no customer row is deleted automatically.
- Supabase usage should be monitored during the pilot; no current overage is
  inferred from the latest engineering evidence, but usage is an external
  operational gate rather than a source-code guarantee.

## Infrastructure capacity evidence

The latest recorded read-only inspection of the Supabase billing and usage
pages was on 2026-10-21. It found the organization on the Free Plan with the
grace period ended and recorded approximately: log ingestion `0.803 / 1 GB`
(80%), egress `2.988 / 5 GB` (60%), database size `148.55 / 500 MB` (31%), and
`4 / 50,000` monthly active users. This is historical capacity evidence, not a
current usage assertion. Recheck usage immediately before the pilot decision;
the source tree cannot prove quota headroom or billing status.

## Go/no-go rule

`GO` requires every open gate above to be checked with release-specific
evidence. Any failed smoke, unresolved privacy boundary, missing rollback
target, quota risk, or unexplained customer-facing error is `NO-GO` until
resolved or explicitly accepted by the operator.
