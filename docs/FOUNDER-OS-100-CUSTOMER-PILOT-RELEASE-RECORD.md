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
| Last deployed application commit | `aecbe2e80ca237cb2a61340c7199f069587bdb39` (stateless modern-discovery truth fix) |
| Last successful App Runner deployment | `40131685736` |
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
- [x] Manual authenticated dashboard UAT on 2026-10-24 reached all Founder OS
  surfaces and inspected Setup, including scope state, first-event evidence,
  SDK/documentation CTAs, identity-resolver guidance, privacy disclosures, and
  key lifecycle controls. No credentials, workspace IDs, or key values were
  recorded.

## Open gates before GO

- [x] The current engineering release candidate is identified as
  `aecbe2e80ca237cb2a61340c7199f069587bdb39`. App Runner run `40131685736`
  passed the exact-SHA deployment-health wait, read-only production smoke,
  runtime-safety audit, and redacted evidence uploads. This is engineering
  verification; it is not the operator's final GO decision.
- [ ] Privacy lifecycle behavior is reviewed for the pilot: export remains
  bounded and secret-free; deletion requests are review-only; destructive
  deletion remains disabled unless a separately approved worker exists.
- [ ] The stale synthetic reliability data is explicitly accepted as test
  evidence in the pilot data-hygiene decision; it must not be presented as a
  customer incident.
- [x] Rollback rehearsal and the release-specific rollback target are linked
  to this exact release. Workflow [40170438059](https://github.com/Krishna3956/CRV/actions/runs/40170438059)
  deployed immutable rollback revision `6d1b72c1aa731ec7c580f4b7911827b205a66524`
  and passed deployment/readiness/HTTPS/read-only smoke; restoration workflow
  [40170901810](https://github.com/Krishna3956/CRV/actions/runs/40170901810)
  restored `aecbe2e80ca237cb2a61340c7199f069587bdb39` and passed the same gate.
- [x] The current release-specific authenticated production smoke is configured
  and passes. Repository secrets were completed in the signed-in GitHub
  session, and workflow [40169807874](https://github.com/Krishna3956/CRV/actions/runs/40169807874)
  passed against `https://app.trackmcp.com` for release
  `aecbe2e80ca237cb2a61340c7199f069587bdb39` without exposing secret values.
- [x] A fresh read-only authenticated smoke rerun,
  [40172215000](https://github.com/Krishna3956/CRV/actions/runs/40172215000),
  passed against the same deployed release and production host. No secret,
  workspace identifier, or payload was recorded.
- [ ] A final operator go/no-go decision is recorded with UTC timestamp and
  accepted limitations. The engineering recommendation remains **HOLD** until
  credentialed UAT, migration/rollback ownership, worker freshness, and the
  remaining protocol interoperability gates are evidenced or explicitly
  accepted by the release owner.

### Distributed rate-limit IAM evidence

The current enablement workflow [40172392815](https://github.com/Krishna3956/CRV/actions/runs/40172392815)
authenticated successfully with the GitHub OIDC role, then was denied the
narrowly scoped `apprunner:UpdateService` permission. It applied no production
mutation and uploaded the redacted artifact
`distributed-rate-limit-mode-40172392815` with outcome `blocked_iam`. The
capability is therefore not claimed for the pilot until the AWS IAM owner adds
that exact service-scoped permission and a subsequent verification succeeds.

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
