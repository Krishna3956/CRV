# Founder OS 100-customer pilot release record

Status: **Draft — not yet a go decision**

This record is intentionally evidence-first. It must not be changed to
`GO` until the open gates below are independently verified on the release
commit and the operator accepts the listed limitations.

## Current deployed baseline — 2026-10-28

App Runner workflow `40578117597` completed successfully for immutable commit
`65e193ad6fa37178935bfa3db8fccd416426984b`. Release gate, image build/push,
rollout, read-only production smoke, immutable release identity, and runtime
safety checks passed. The chained authenticated production smoke
`40579268329` also completed successfully for the same release. The release
remains Draft/HOLD because the owner, backup/recovery, privacy acceptance,
worker freshness, and credentialed lifecycle/transport gates are still open.

The following entries are historical baselines retained for continuity.

App Runner workflow `40497434962` subsequently completed successfully for
immutable commit `4efa2e1bd444706e84d78ef85b8a7b3b133a46aa`. This is the latest
verified runtime deployment; the change is deployment-trigger hardening and
does not alter application behavior. TrackMCP CI `40498017114` also completed
successfully for the later documentation-only `a0d2485` commit, which was not
deployed because the tightened path filter correctly excludes ledger-only
changes.

The documentation-only reconciliation commit `e802d16` was pushed to
`main`; hosted TrackMCP CI run `40496271191` completed successfully. App
Runner workflow `40496271215` initially showed stale `in_progress` state with
no job update, but later reached terminal `success` on the exact SHA. It is
therefore valid deployment evidence for the documentation-only candidate;
the runtime behavior remains unchanged from the `9026fa6` candidate recorded
below; the `4efa2e1` deployment is now the verified runtime baseline.

App Runner workflow `40494157458` successfully deployed immutable application
commit `9026fa63fdc9b8082372fd50fda93077b8162998`. Rollout, production smoke,
immutable runtime identity, runtime-safety audit, and redacted evidence upload
passed. Authenticated production smoke `40495081946` also passed for this exact
commit, but remains read-only evidence rather than key-lifecycle UAT. The
release remains Draft/HOLD until the open operational and owner gates below
are independently accepted.

The previously deployed baseline below remains historical evidence.

App Runner workflow `40468547762` successfully deployed immutable application
commit `9638e23c8529f9b1781d96413529e33a692715ed`. Rollout, production smoke,
immutable runtime identity, runtime-safety audit, and redacted evidence upload
passed. The latest rollout has not been represented as a new authenticated
key-lifecycle UAT run; the prior authenticated smoke remains historical
evidence. The release remains Draft/HOLD until the open operational and owner
gates below are independently accepted.

The preceding deployed engineering baseline was `7551e2f017cce2695803b13ce5605eee72d4a9f8`,
deployed by App Runner workflow `40349662276`. It remains retained as
historical evidence; the current baseline above is the one to use for release
review.
The release remains Draft/HOLD; this baseline contains the worker-health
recovery-evidence hardening, not a final operational SLO acceptance.

## Latest source verification — 2026-10-28

The current repository source is `main` at `HEAD`. The latest local release gate
passes **144 suites**, lint, the production build (**177 routes**), and
`git diff --check`. The deployed source is `65e193a` via App Runner workflow
`40578117597`; authenticated production smoke `40579268329` passed for the same
immutable release. Documentation-only postflight commits after that runtime
baseline do not require a new application image.

The preceding deployed source was `4efa2e1` (including the health-report semantics
correction that honors a proven AWS scheduler window while retaining historical
worker warnings and the deployment-trigger hardening). Mainline now also
contains the first-ingest UAT ledger update `a0d2485`; its focused
documentation/accessibility contracts pass, and the full local release gate,
lint, and 177-route build were green before deployment. Push-triggered
scheduler activation for the reviewed scheduler change completed successfully
in workflow `40470584190` with scheduling disabled by default.
The transient App Runner smoke retry boundary remains explicitly retained as
deployment evidence rather than being treated as a customer-facing guarantee.
The prior deployed source at `9638e23` remains retained as historical evidence
and is not the current runtime baseline.
The preceding source verification passed the full local release gate at
**143 suites**, lint, the production build (**177 routes**), and
`git diff --check`.
The direct App Runner transport fixture passed official Streamable HTTP and SSE
client flows with metadata-only observations. The manually dispatched hosted
transport workflow completed safely but skipped its write-enabled step because
the dedicated `TRACKMCP_TRANSPORT_SMOKE_KEY` repository secret is not present.
This is source and bounded transport evidence only; it does not alter the
release HOLD or close the credentialed, scheduler, backup, privacy-acceptance,
or protocol-interoperability gates below.

Authenticated production smoke workflow `40475627480` passed against the
deployed `37579ea` candidate and retained redacted artifact
`production-auth-smoke-37579eade74a20818cd4f83569493e830e4855de`. It
reverified dashboard read models, tenant/workspace isolation and conflict
handling, API-key mutation denial, and revoked-key rejection. The run was
read-only and therefore does not close write-gated key lifecycle, first-ingest,
transport, or customer-endpoint UAT.

Health validation workflow `40352798759` then ran against main `25877da` and
uploaded redacted artifact `12663714778`. It reported eight samples, including
two scheduled and six recovery/manual runs, and correctly remained `warning`
with `scheduled_samples_not_met`, freshness, failure, and cadence reasons.
This validates the monitor’s evidence boundary; it is not a sustained worker
SLO pass.

## Latest bounded insight-evidence deployment — 2026-10-26

PR #545 merged the bounded insight evidence metadata feature as
`4e77595087bb14ede1fce4fb573322b3f925d572`. Insight cards now show affected
volume, eligible volume, confidence, metric, and threshold metadata. This
improves interpretation of the signal but does not convert incomplete business
outcomes into success claims.

App Runner workflow `40330265695` successfully deployed immutable main commit
`83131ecb7cd0d6d4f3d71ac9bb015b407386ba5c` after the service-readiness
preflight. Production smoke, release-identity verification, and runtime
safety-flag audit passed. Retained artifacts are
`production-smoke-83131ecb7cd0d6d4f3d71ac9bb015b407386ba5c` (`12653569033`),
`runtime-flags-83131ecb7cd0d6d4f3d71ac9bb015b407386ba5c` (`12653489115`), and
`app-runner-host-83131ecb7cd0d6d4f3d71ac9bb015b407386ba5c` (`12653798778`).
This updates the deployed baseline only; the release remains Draft/HOLD.

## Latest alert-delivery evidence deployment — 2026-10-26

App Runner workflow `40341314542` deployed merged main commit
`1e6c7144a6e2714df787bc6ed6fbc87f2a447aba`; rollout, production smoke,
runtime identity, and runtime safety checks passed. Retained artifacts are
`production-smoke-1e6c7144a6e2714df787bc6ed6fbc87f2a447aba` (`12659303738`),
`runtime-flags-1e6c7144a6e2714df787bc6ed6fbc87f2a447aba` (`12660500729`), and
`app-runner-host-1e6c7144a6e2714df787bc6ed6fbc87f2a447aba` (`12658999346`).
This validates the bounded Evidence UI deployment only; the release remains
Draft/HOLD.

## Latest custom-range deployment — 2026-10-26

App Runner workflow `40335675552` successfully deployed and verified merged
main commit `57281256e5ac1721a075f9b6f075b326530b1258`. The bounded release
gate, image binding, rollout wait, production smoke, runtime identity, and
runtime safety audit passed. A first smoke attempt hit a transient direct-origin
timeout; the workflow rerun passed all 36 checks and is the authoritative
result. Retained artifacts are `production-smoke-57281256e5ac1721a075f9b6f075b326530b1258`
(`12657756599`), `runtime-flags-57281256e5ac1721a075f9b6f075b326530b1258`
(`12658121349`), and `app-runner-host-57281256e5ac1721a075f9b6f075b326530b1258`
(`12658645535`). This confirms deployment only; the release remains Draft/HOLD.

## Authenticated smoke on the current deployed baseline — 2026-10-26

Workflow `40332727179` passed against the exact deployed immutable commit
`83131ecb7cd0d6d4f3d71ac9bb015b407386ba5c`. The workflow verified that commit
before running the read-only multi-workspace authentication, tenant-boundary,
revoked-key, and health checks. Redacted evidence is retained as artifact
`production-auth-smoke-83131ecb7cd0d6d4f3d71ac9bb015b407386ba5c`
(`12655396002`). This is current-release smoke evidence only and does not
change the release from Draft/HOLD or close the external pilot gates.

## Current-main verification — 2026-10-26

Main commit `26da04bd40810a82906e4961ee211a3f2dfe876a` passed the full local
release gate (137 suites), lint, and production build verification.
This is engineering verification and does not change the record from
Draft/HOLD while the external pilot gates remain open.

## Refresh-worker remediation evidence — 2026-10-26

PR #532 (`e8b3709d2e3402d82d5f54ca1656ea41db5be554`) added bounded recovery
dispatch when the health monitor observes a warning and no worker run is
active. PR #533 (`dd4ffec664c2dceaf920cfeaec94438b757f78b6`) corrected the
health summary output so the evidence is rendered without shell substitution.
Live health run `40326279012` reported the existing warning state with
`freshness_budget_exceeded` and `schedule_cadence_gap`, then dispatched worker
run `40326311792`, which completed successfully. This is remediation evidence,
not proof of sustained freshness; the release remains Draft/HOLD.

PR #535 subsequently added a 20-minute completed-run cooldown to the recovery
path. This prevents repeated dispatches caused only by historical stale samples
while preserving recovery when no recent worker run exists.

## Historical evidence reconciliation — 2026-10-26

The deployed application at this historical checkpoint was
`d338544b535132aa6f1c0cb8fc6174654f9bf28f`.
App Runner workflow `40313575422` completed successfully; the deployment
uploaded `production-smoke-d338544b535132aa6f1c0cb8fc6174654f9bf28f`,
`runtime-flags-d338544b535132aa6f1c0cb8fc6174654f9bf28f`, and
`app-runner-host-d338544b535132aa6f1c0cb8fc6174654f9bf28f`. Authenticated
production smoke workflow `40314461586` also passed and uploaded
`production-auth-smoke-d338544b535132aa6f1c0cb8fc6174654f9bf28f`.
The preceding `6582c90` deployment remains retained as historical evidence.

The guarded first-ingest workflow `40316460050` subsequently passed against
the deployed mainline and uploaded redacted artifact
`production-ingest-b61aa69459102bdf7a0bd11413c983e03233f351` (`12647117310`).
It sent one bounded metadata-only event and verified
`accepted_telemetry=true`; this closes transport acceptance and first-ingest
UAT, but not CLI activation, key lifecycle mutation, or business-workflow
completion.

An authenticated browser UAT then inspected all dashboard views (Overview,
journey, activity, quality, issues, resources/prompts, identity, evidence, and
Setup). Navigation and data-bound rendering passed read-only inspection. Setup
exposed SDK and OpenTelemetry documentation CTAs plus resolver and scoped-key
guidance; dashboard privacy boundaries, insufficient-data states, synthetic
incident labeling, and unknown outcomes were visible as documented. This is
presentation/navigation evidence only and does not close write-gated lifecycle,
worker-freshness, or release-owner gates.

The current write-gated lifecycle preflight `40318987100` also completed
successfully, but its disposable mutation step was skipped because the four
dedicated lifecycle secrets are not configured. No production key was created,
rotated, or revoked; lifecycle UAT remains an external credential gate.
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

The refresh-worker backlog recovery in PR [#528](https://github.com/Krishna3956/CRV/pull/528)
merged as `31c3dd5beed17cf5f226ce90ca1cc08b8113132a`. Its post-merge worker
run [40321051841](https://github.com/Krishna3956/CRV/actions/runs/40321051841)
used ten bounded lease batches and reported `processed=0`,
`max_queue_lag_ms=0`, `freshness_slo=no_backlog_observed`, and no failed or
retryable work. This clears the observed backlog at that checkpoint; it does
not close the sustained scheduler-freshness gate.

Durable semantic-fact writes are now enabled through the guarded workflow
[40322891985](https://github.com/Krishna3956/CRV/actions/runs/40322891985);
artifact `12650520660` records `fact_writes=true` with
`rate_limit_mode=supabase`. First-ingest smoke `40323457545`, refresh-worker
run `40323571185`, and authenticated read-only smoke `40323679620` all passed.
The signed-in Supabase SQL editor then returned 32,771 rows in
`trackmcp_semantic_facts`, with latest `observed_at=2026-10-26 12:36:49+00`.
This closes the deployed ingest-to-durable-fact activation gap while preserving
the existing insufficient-evidence outcome rules.

## Release identity

| Item | Verified value |
| --- | --- |
| Pilot scope | First 100 customers, desktop dashboard boundary |
| Production hosts | `trackmcp.com`, `app.trackmcp.com` |
| Last deployed application commit | `70534428fd69a4fa5a07f46adad504a32fdfe262` (identity-verified current baseline) |
| Last successful App Runner deployment | `40451066166` |
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
- [x] Local full release gate passed on the current source: 137 suites,
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
  `73d74fb36adf824b2b2cf53b07ece36e1a0302d4`. App Runner run `40365790289`
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
