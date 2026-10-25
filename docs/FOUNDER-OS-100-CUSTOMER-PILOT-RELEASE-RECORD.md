# Founder OS 100-customer pilot release record

Status: **Draft — not yet a go decision**

This record is intentionally evidence-first. It must not be changed to
`GO` until the open gates below are independently verified on the release
commit and the operator accepts the listed limitations.

## Release identity

| Item | Verified value |
| --- | --- |
| Pilot scope | First 100 customers, desktop dashboard boundary |
| Production hosts | `trackmcp.com`, `app.trackmcp.com` |
| Last deployed application commit | `2e135f194f36e278232c6a46890b1ce850d1e9ba` (verified pilot runtime) |
| Last successful App Runner deployment | `40198791603` |
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
- [x] Local full release gate passed on the current source: 128 suites,
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
- [x] Read-only authenticated tenant-scope smoke passed on 2026-10-25 against
  `https://app.trackmcp.com` with disposable workspace credentials: 37 checks
  covered both key-status responses, conflicting-workspace resistance, every
  Founder OS v2 read model, legacy analytics/tool-quality/traces projections,
  API-key denial for Action Queue mutations, and revoked-key rejection. The
  redacted report is `/tmp/trackmcp-auth-smoke-2026-10-25.json`; it contains no
  keys, workspace identifiers, or response bodies. This is deployed runtime
  evidence for the observed candidate, not key lifecycle or ingest evidence.
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
  `2e135f194f36e278232c6a46890b1ce850d1e9ba`. App Runner run `40198791603`
  passed the exact-SHA deployment-health wait, read-only production smoke,
  runtime-safety audit, and redacted evidence uploads. This is engineering
  verification; it is not the operator's final GO decision.
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
- [x] A fresh read-only authenticated smoke rerun is available in the handoff
  ledger (36 checks, redacted). Queue item 249 records the exact-SHA
  authenticated scope smoke and its redacted artifact; no secret, workspace
  identifier, or payload is recorded.
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
- [ ] Database backup posture remains open: read-only Supabase inspection
  records region `us-east-1` (East US/North Virginia), but the current Free Plan
  surface exposes no usable backup schedule, restore point, restoration contact,
  or completed restore rehearsal. The pilot must keep this as an explicit
  operational limitation until an owner records and accepts it.

### Distributed rate-limit IAM evidence

The current enablement workflow [40172392815](https://github.com/Krishna3956/CRV/actions/runs/40172392815)
authenticated successfully with the GitHub OIDC role, then was denied the
narrowly scoped `apprunner:UpdateService` permission. It applied no production
mutation and uploaded the redacted artifact
`distributed-rate-limit-mode-40172392815` with outcome `blocked_iam`. The
capability is therefore not claimed for the pilot until the AWS IAM owner adds
that exact service-scoped permission and a subsequent verification succeeds.

For the bounded first-100 pilot, distributed multi-instance limiting is
explicitly outside the claimed scope. The deployed process-local limiter is the
documented pilot boundary; AWS IAM enablement remains post-pilot work and is
not a hidden release requirement.

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
