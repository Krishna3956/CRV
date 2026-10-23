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
| Last deployed application commit | `71492d5` |
| Last successful App Runner deployment | `40030062391` |
| Readiness ledger | `docs/FOUNDER-OS-100-CUSTOMER-READINESS-LEDGER.md` |
| Current release-record change | Commit `0f89937` (current release identity and credentialed-smoke gate reconciliation) |

## Verified gates

- [x] Founder OS tabs 1–6 have bounded authenticated production assertions from the prior live release inspection; these are retained as historical evidence and do not replace the current credentialed smoke.
- [x] App Runner release gate, image build, rollout, readiness, HTTPS, and
  read-only production smoke passed for the deployed commit.
- [x] Bounded production load passed: 120/120 requests, zero errors and
  timeouts, tenant isolation passed, p95 2.11 seconds against the 3-second
  pilot budget.
- [x] Refresh worker five-slice checkpoint passed with zero retryable/failed
  results and an empty queued/running/retryable postflight at the checkpoint.
- [x] Tab 6 synthetic canary incidents are visibly labeled as test evidence
  and are not counted as customer health claims.
- [x] Read-only retention dry run found no eligible rows in the configured
  event, fact, or action-queue retention datasets.
- [x] Privacy request and deletion-batch tables exist, deny browser-role
  `SELECT`, and deletion-batch indexes are present.
- [x] Local privacy, deletion-plan, accessibility, tenant-isolation,
  analytics, package-consumer, and pilot contract suites passed.

## Open gates before GO

- [x] PR #141 is merged and the resulting main commit has a fresh green CI
  run.
- [x] The final release commit has a fresh App Runner deployment and the
  production smoke artifact is attached to this record.
- [ ] Privacy lifecycle behavior is reviewed for the pilot: export remains
  bounded and secret-free; deletion requests are review-only; destructive
  deletion remains disabled unless a separately approved worker exists.
- [ ] The stale synthetic reliability data is explicitly accepted as test
  evidence in the pilot data-hygiene decision; it must not be presented as a
  customer incident.
- [ ] Rollback rehearsal and the release-specific rollback target are linked
  to this exact release.
- [ ] The current release-specific authenticated production smoke is configured
  and passes. Workflow `40031387951` failed closed because the repository is
  missing `TRACKMCP_AUTH_SMOKE_KEY_A`, `TRACKMCP_AUTH_SMOKE_KEY_B`,
  `TRACKMCP_AUTH_SMOKE_WORKSPACE_A`, and `TRACKMCP_AUTH_SMOKE_WORKSPACE_B`.
- [ ] A final operator go/no-go decision is recorded with UTC timestamp and
  accepted limitations. The engineering recommendation remains **HOLD**
  until the Supabase quota/grace-period risk is resolved or explicitly
  accepted for the entire pilot window.

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
- Supabase quota/billing status must be monitored before inviting the full
  pilot cohort.

## Infrastructure capacity evidence

Read-only inspection of the Supabase billing and usage pages on 2026-10-21
found the organization on the Free Plan with the grace period ended. Current
cycle usage was approximately: log ingestion `0.803 / 1 GB` (80%), egress
`2.988 / 5 GB` (60%), database size `148.55 / 500 MB` (31%), and `4 / 50,000`
monthly active users. There is no current overage, but the log-ingestion
headroom is only about 20%; the observed rate could cross the included quota
during the pilot window. The application deployment passed, but this is a
real availability risk because Supabase states that over-quota projects may
return HTTP 402 or become restricted.

## Go/no-go rule

`GO` requires every open gate above to be checked with release-specific
evidence. Any failed smoke, unresolved privacy boundary, missing rollback
target, quota risk, or unexplained customer-facing error is `NO-GO` until
resolved or explicitly accepted by the operator.
