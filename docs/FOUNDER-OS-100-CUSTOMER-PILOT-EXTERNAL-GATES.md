# First-100-customer external-gate register

Status: **HOLD**  
Updated: 2026-10-29 (Asia/Calcutta)

This register separates evidence that engineering can produce from decisions
that require the release owner or an infrastructure-provider control plane. It
is intentionally not a GO approval and must not be treated as one.

## Engineering baseline

- `main`: current default branch. Immutable deployed SHAs belong in the
  release record; PR checks remain attached to their exact review commits.
- Current deployed application: `e0629ea1d02331a1c9cd26eb82d61bfe0a93529f`,
  App Runner workflow `40845415688` (successful rollout; rollout,
  release gate, production smoke, immutable identity, runtime-safety checks,
  and live health identity verification passed).
- Current source verification: `main` at `HEAD`
  (`HEAD`); hosted TrackMCP CI `40845415274` passed across the
  web/JavaScript, Go, and .NET lanes. The refresh scheduler
  and health evidence are recorded below. This does not close the external
  owner, backup, privacy, or customer-owned protocol gates.
- Historical deployed baselines retained for audit include `9638e23c8529f9b1781d96413529e33a692715ed`
  (App Runner workflow `40468547762`) and `37579eade74a20818cd4f83569493e830e4855de`
  (App Runner workflow `40474794151`), plus the earlier deployment identity
  `4efa2e1bd444706e84d78ef85b8a7b3b133a46aa` and workflow `40497434962`
  retained by the acceptance contract.
- This register records the already-successful `e0629ea1` rollout and its
  bounded evidence. It does not change the external owner, backup, privacy, or
  customer-owned protocol decisions.
- Queue: 263 total, 260 checked, and P0 queue items `020`, `157`, and `260`
  remain open.
- Full release gate: **152 suites passed**, with lint and the 209-route
  production build green (the prior 177-route baseline remains retained in
  historical evidence).
- Authenticated device-flow UAT covers expired, denied, multiple-membership,
  and zero-membership workspace creation without browser key disclosure.
- Authenticated production scope smoke `40429116070` passed against immutable
  commit `5e26564ad446f11f712de66cf0594a0b803a7d70`; its redacted artifact
  covered key status, conflicting-workspace isolation, Founder OS v2 and
  legacy read models, API-key Action Queue denial, revoked-key rejection, and
  privacy-safe projections. It was read-only and did not create, rotate,
- Authenticated production smoke `40475627480` also passed for the deployed
  `37579ea` candidate; retained redacted artifact
  `production-auth-smoke-37579eade74a20818cd4f83569493e830e4855de`
  reverified dashboard read models, tenant/workspace isolation and conflict
  handling, API-key mutation denial, and revoked-key rejection. This remains
  read-only evidence and does not close first-ingest, transport, or
  customer-endpoint UAT. A separate terminal-only disposable production run
  has since verified workspace/key creation, rotation, and revocation; that
  evidence does not claim customer-owned endpoint interoperability. A separate
  terminal-only device activation and first-event UAT now verifies the
  browser-approval/CLI-redemption path with a disposable key; it does not
  change the customer-owned endpoint or protocol boundary.
  revoke, ingest, or mutate dashboard state.
- A manual-only `customer-endpoint-uat.yml` workflow now accepts one
  operator-supplied HTTPS endpoint and reviewed MCP transport/version, runs a
  bounded initialize plus catalog-discovery pass through the official client,
  and uploads only a mode-0600 redacted report. It rejects unsafe targets,
  cross-origin redirects, arbitrary tool calls, and implicit OAuth flows. The
  harness improves the evidence path but does not close this gate until a
  credentialed customer endpoint run is executed and accepted.
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
| 020 — limited pilot scope | Release owner | Timestamped approval naming the 100-customer cohort, supported hosts and paths, known limitations, rollback owner, and data-handling boundary | OPEN; the release record remains Draft/HOLD |
| 157 — database recovery posture | Infrastructure/provider owner | Region and tier, backup/PITR policy or an explicitly accepted limitation, restoration owner, and a tested recovery reference | OPEN; authenticated Supabase inspection records Free tier, East US/`us-east-1`, Nano/shared compute, and PITR **Disabled**. A fresh signed-in browser inspection of Database → Backups (2026-10-27) showed no usable scheduled-backup or restore-point evidence. No restoration contact or rehearsal is evidenced. |
| Privacy lifecycle acceptance | Release owner | Explicit acceptance that export is bounded/secret-free, deletion requests are review-only, and destructive deletion is disabled without an approved worker | OPEN in the release record |
| Synthetic reliability-data hygiene | Release owner | Explicit acceptance that synthetic canary rows are test evidence only and cannot be presented as customer incidents | OPEN in the release record |
| Refresh scheduler enablement | Infrastructure/provider owner | Store `TRACKMCP_REFRESH_WORKER_SECRET` in Secrets Manager, map the App Runner runtime variable from that ARN, deploy the disabled-first AWS Scheduler stack, verify endpoint/token/DLQ behavior, enable the five-minute schedule, and retain at least three scheduled samples within the 15-minute freshness budget | **HOLD / warning:** latest health artifact `12885673154` from run `40848128417` proves four scheduled invocations and four end-to-end successes; the current scheduled sample is within budget with zero failed/retryable work, but the AWS rolling worker metric still contains an older `10606459 ms` lag datapoint. Let the bounded window roll forward and re-run the health evaluation before calling freshness green. |
| 260 — final go/no-go | Release owner | Timestamped GO/NO-GO decision linking the green evidence and accepted limitations | OPEN; engineering recommendation remains HOLD |

## Closure rule

Engineering may add evidence, tests, or implementation, but must not check any
row above merely because source tests are green. A gate becomes closed only
when the named evidence is retained in the release record and the acceptance
contract still passes. Until then, customer-facing readiness claims remain
unapproved.
