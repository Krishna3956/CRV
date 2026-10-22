# Founder OS 100-customer pilot runbook

Status: review-ready runbook. This document does not execute a deployment,
publish a package, or run SQL.

The pilot is approved only when every required gate has an evidence link,
timestamp, release SHA, operator, and redacted test workspace identifier. A
green local test is not evidence of production behavior.

## 0. Evidence and safety rules

Record for every run:

- release commit SHA and container image digest;
- environment and region;
- UTC start/end timestamps;
- disposable pilot workspace ID (never a customer workspace);
- command or browser flow used;
- pass/fail result and sanitized response summary;
- operator and incident/rollback reference if applicable.

Never record API keys, device codes, redemption IDs, admin keys, cookies,
bearer tokens, Supabase service-role values, raw event payloads, customer
emails, or complete URLs containing credentials.

Use a fresh disposable workspace for the smoke. Revoke its key and remove its
test data through the approved operator process after the run.

## 1. Freeze and classify the release

From the repository root:

```bash
cd trackmcp-nextjs
npm run audit:release-scope
node scripts/release-scope-audit.mjs --strict
```

Expected result: no review-required paths, no untracked build/campaign/CSV/
environment/diagnostic artifacts, and intended paths matching
`FOUNDER-OS-RELEASE-MANIFEST.md`. If strict mode fails, stop. Do not use
`git add .`; stage only reviewed paths after classification.

## 2. Local release gate

Run from a clean isolated checkout of the candidate:

```bash
npm ci
npm run test:release-gate
npx tsc --noEmit
npm run lint
npm run build
npm run smoke:local
```

Record the actual command output, candidate SHA, UTC timestamp, environment,
and any warning in the evidence ledger. Do not copy a historical suite count,
page count, or lint result into a new candidate record: the test suite and
application surface legitimately change over time. A local pass never
substitutes for production evidence.

## 3. Schema and runtime configuration gate

The release owner runs the reviewed, read-only Supabase postflight files
against production and stores their output with the release record. Do not run
a blanket migration command from this runbook.

Before enabling derived writes or distributed rate limiting, verify the required
tables, columns, indexes, constraints, service-role-only RPC privileges,
runtime `SECRETS_ARN`, and worker secrets. `TRACKMCP_ENABLE_FACT_WRITES=true`
requires the read-model postflight; `TRACKMCP_ENABLE_REFRESH_JOBS=true`
requires the refresh-job migration, worker RPC postflight, and configured
external worker; `TRACKMCP_RATE_LIMIT_MODE=supabase`
requires the rate-limit postflight. The deployment script must fail before AWS
changes when these relationships are invalid.

## 4. Production deployment gate

Use the existing reviewed GitHub Actions/App Runner path. Capture the workflow
URL, deployed commit SHA, App Runner status and region, image digest, runtime
feature modes, and a known-good rollback image before smoke begins. A green
workflow is insufficient unless the deployed SHA equals the reviewed SHA.

The reviewed deployment workflow runs `test:release-gate` before building and,
after the specific App Runner deployment operation succeeds and the service
reports `RUNNING`, runs the credential-free
`smoke:production-pilot` against the App Runner service URL. Retain its redacted
workflow artifact with the deployment evidence. That artifact proves public and
unauthenticated HTTP boundaries only; it does not replace the authenticated,
tenant-isolation, first-ingest, migration, worker, load, or rollback gates below.
Review its `outcome`, `checks_total`, `checks_executed`, and `checks_skipped`
fields rather than inferring success from individual statuses. For a deployment
run, its `candidate_sha` and `image_digest` must be populated and reconciled
with the reviewed commit and the actual App Runner image; `not-supplied` is not
deployment-linkage evidence.

## 5. CLI activation smoke

Use a clean temporary project with no existing TrackMCP key:

```bash
npx @trackmcp/cli init
```

Verify the device session, HTTPS browser page, signup/sign-in handoff,
workspace selection/creation, browser approval without key display, polling,
one-time redemption, restrictive local key storage, and the second `init`
shortcut when a valid key exists. Exercise expired, denied, already-approved,
already-redeemed, rate-limited, and interrupted flows. Record only status
categories and redacted event IDs; never record verification codes or keys.

## 6. First ingestion and dashboard

With the disposable key, run one representative TypeScript or Python
instrumented MCP request. Confirm accepted ingest, one activation milestone,
overview/tools/reliability/outcomes/data-trust/catalog/Action Queue views, and
explicit empty/partial/stale/unresolved/truncated states. Request the account
export and verify it excludes keys, tokens, raw payloads, device codes, and
unbounded delivery data.

## 7. Negative authorization and tenant isolation

Create disposable workspaces A and B with separate keys and memberships. Run
the v1/v2 authorization matrix with the wrong key and wrong workspace. Pass
requires zero cross-workspace reads or mutations, stable 401/403/404 semantics,
API keys denied human Action Queue mutations, and ambiguous browser workspace
selection rejected rather than guessed.

For the read-only key-scope portion, use the bounded harness with two
disposable workspace keys. It intentionally ignores a conflicting
`workspace_id` query parameter and records only status categories:

```bash
cd trackmcp-nextjs
TRACKMCP_AUTH_SMOKE_CONFIRM=I_UNDERSTAND_PRODUCTION_AUTH_SMOKE \
TRACKMCP_AUTH_SMOKE_BASE_URL=https://trackmcp.com \
TRACKMCP_AUTH_SMOKE_KEY_A='(operator supplies disposable key A)' \
TRACKMCP_AUTH_SMOKE_KEY_B='(operator supplies disposable key B)' \
TRACKMCP_AUTH_SMOKE_WORKSPACE_A='(workspace A)' \
TRACKMCP_AUTH_SMOKE_WORKSPACE_B='(workspace B)' \
npm run smoke:production-auth
```

The harness is read-only and never writes keys, workspace IDs, response bodies,
or authorization material to its report. It does not replace the full RLS and
key-lifecycle gates below.

## 8. Worker, scheduler, and rate-limit gate

Run one authenticated **non-empty disposable** refresh batch and cleanup run.
Verify lease fencing,
expired-lease recovery, bounded retry/backoff, terminal failure behavior,
non-2xx unhealthy batch results, serialized GitHub schedules, two-minute job
timeouts, distributed counters across two App Runner instances, bounded
`Retry-After`, trusted forwarding headers, and service-role-only cleanup.
Record p50/p95/p99 latency, error rate, worker lag, retries, terminal failures,
and rate-limit false positives.

## 9. Package publication and clean consumers

The currently reviewed TypeScript SDK release candidate is `@trackmcp/sdk@0.1.9`
(publication must be verified before pilot use),
`@trackmcp/cli@0.1.4`, and `trackmcp==0.1.6`. Publish only a new reviewed
version after duplicate-version preflight passes.
Install those exact registry versions in clean temporary npm and Python
consumers, then run the first-event/key-status smoke. Record registry URLs,
versions, checksums, provenance, and consumer results without recording keys.

## 10. Load and failure recovery

Agree numeric availability, latency, ingest, worker-lag, rate-limit, App Runner,
and database thresholds before the run. Retain p50/p95/p99, timeout count,
4xx/5xx/transport split, host memory/resource metrics, queue depth/oldest age,
retry count, and terminal failure count. Exercise ingest/database timeouts,
worker crash, expired lease, duplicate event, lost redeem response, and revoked
key. Verify fail-open SDK behavior, idempotent redemption, bounded retries, and
no duplicate keys or facts.

## 11. Rollback gate

Record a known-good image digest and schema compatibility decision before the
pilot. Rehearse application rollback in an approved disposable service or
maintenance window. Verify the old image starts with the additive schema,
ingest and key validation remain available, and the rollback SHA is recorded.

## 12. Pilot decision

Approve the first 100 customers only when every P0/P1 row in
`FOUNDER-OS-LAUNCH-READINESS-AUDIT.md` has production evidence. If evidence is
missing, launch only the explicitly documented limited scope and label the
capability unverified or unsupported. “No failures observed” is not a
completed gate.

## Open-gate ledger mapping

Use this table to make sure every currently unchecked queue item receives a
redacted evidence row. It is a routing aid, not evidence by itself.

| Queue items | Runbook step | Required evidence shape |
| --- | --- | --- |
| 020, 259–260 | 0, 1, 12 | Named release owner, approved limited scope, candidate/deployed SHA, exception decision, incident contact, and rollback owner. |
| 045–049, 051–054 | 5 | Browser evidence for pending, invalid, expired, denied, approved/redeemed, one/multiple workspace, creation, and unauthenticated-control states; never retain codes or keys. |
| 141–148, 156–157 | 3, 4, 11 | Executed migration reference, each read-only postflight, region/backup/restoration contact, immutable image digests, and additive-schema rollback decision. |
| 178–179, 257–258 | 8, 10 | Worker/trigger configuration reference, non-empty disposable batch, lag/retry/terminal evidence, and two-instance distributed rate-limit result if claimed. |
| 249–250 | 5–7 | Disposable activation/ingest plus cross-workspace and key-lifecycle negative authorization results. |
| 251, 255 | 9 | Version-uniqueness preflight, registry URL/checksum/provenance, and exact published-package clean-consumer result. |
| 256 | 11 | Approved-window rollback rehearsal with old-image compatibility and post-rollback smoke evidence. |
