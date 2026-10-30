# Founder OS: 100-customer pilot status

Last verified: 2026-10-30 (Asia/Kolkata)

This is the concise release-owner handoff. It records evidence that exists,
what is intentionally not claimed, and the next work queue. It is not a
promise that every product capability is complete.

## Current runtime checkpoint — 2026-10-30

- The live App Runner runtime is `1afc766ebcf3db9b9149e02104eab74dd377cd42`; deployment workflow `40978136879` (retry attempt 2) passed its post-deploy checks. `main` is now `4f043236b9d1ed51687a4972eba118b7fdfa3616` after a documentation-only merge, and the uncached health probe reports the deployed application SHA.
- One-pass Google OAuth was browser-verified with `krishnaatmu@gmail.com`: the flow reached the authenticated dashboard and loaded the `krishnaatmu` workspace without the prior second-login workaround.
- Social buttons render immediately, terms are not a prerequisite for social OAuth, the dashboard retries the callback session, and concurrent workspace creation is idempotent. These behaviors are covered by focused contract tests.
- Marketing translation was browser-verified on `trackmcp.com` with `zh-CN` preserved after scrolling. The runtime uses the trusted App Runner origin fallback when the public edge rejects direct translation API requests.

The release remains **HOLD** for the same external gates below: recovery ownership, privacy acceptance, credentialed key/customer-endpoint UAT, remaining protocol limitations, and release-owner go/no-go.

## Current evidence checkpoint — 2026-10-29

- Source `main` is `08ef4c00781a357d6ec9a8273902155f9344974b`; the latest live
  application runtime remains immutable `32ff5dfe` because the subsequent
  merges are documentation/test-harness only. App Runner rollout `40888363134`
  ended during its final wait, but an uncached live health probe confirmed the
  exact runtime SHA; its workflow completion is not claimed.
- The current local release gate passes **154 suites**, TypeScript, lint,
  `git diff --check`, and the production build (**211 routes**).
- Read-only authenticated smoke `40893382834` passed **37/37** tenant/privacy
  checks. Direct-origin first-ingest `40894964464` and SDK-shaped public-edge
  first-ingest `40896249223` both accepted one bounded metadata-only event and
  verified analytics read-back; their redacted artifacts are `12907131051` and
  `12906059482`.
- Refresh-worker health evaluation `40891096616` (`12905900486`) reports a
  healthy bounded window: zero scheduler/worker failures, four complete
  samples, and maximum lag `867340 ms` within the `900000 ms` budget.
- Production GitHub OAuth is configured in Supabase and verified end to end in
  the signed-in browser. Google is configured in the dedicated Google Cloud
  project `trusty-diorama-513117-f6` and enabled in Supabase, with the
  TrackMCP account registered as a Google test user. A fresh Google browser
  flow using `krishnaatmu@gmail.com` reached consent, returned to
  `app.trackmcp.com/dashboard`, and loaded the `krishnaatmu` workspace. New-user
  onboarding and device-flow OAuth return-path checks remain open.

The release remains **HOLD** pending backup/PITR ownership, production privacy
acceptance, credentialed key-lifecycle/customer-endpoint UAT, the remaining
OAuth onboarding/device-flow checks, and release-owner GO/NO-GO acceptance.

## Verified and shipped

- `origin/main` is `HEAD` (active pilot evidence baseline). The current
  deployed runtime and source reconciliation are recorded in the checkpoint
  above; the older `b98c6f41` rollout remains historical evidence only.
- Production schema postflights verified required tables, indexes, functions,
  RLS/privilege boundaries, constraints, integrity aggregates, and catalog
  entity-read privacy checks with zero invalid rows in the audited sets.
- The public Security page now discloses the backup/recovery boundary; it does
  not claim schedules, PITR, restore testing, or restoration ownership that the
  selected provider plan does not supply.
- SDK/CLI/Python/Go/.NET consumer, OTLP JSON/protobuf, protocol observer,
  tenant-isolation, privacy, accessibility, and documentation-navigation
  checks are green.
- The customer-endpoint UAT runner now has a release-gate integration fixture
  that exercises the official Streamable HTTP client through initialize,
  tools/resources/resource-template/prompts discovery, metadata-only adapter
  delivery, and redacted evidence drain. The private-target override is
  explicit and loopback-only; it does not change production HTTPS policy.
- Production key rotation was executed in the authenticated owner dashboard;
  the old key is revoked and the replacement secret was shown once and not
  persisted. Server adoption of the replacement remains a separate check.
- The refresh backlog coalescer was applied in production: 12,490 redundant
  legacy queue rows were marked cancelled, 196 canonical ingest-window jobs
  were preserved, and the latest bounded worker run processed 40/40 with zero
  retryable or failed jobs. This is operational recovery evidence, not the
  sustained three-sample freshness pass.
- The exact distributed-rate-limit IAM policy is present at
  `docs/FOUNDER-OS-RATE-LIMIT-IAM-POLICY.json`; its contract test passed. AWS
  applied the policy to `GitHubActionsDeployRole`, including the resource-scoped
  `iam:PassRole` handoff required by App Runner.
- Guarded distributed-rate-limit workflow `40220255833` completed successfully;
  App Runner configuration update and live postflight verification passed.
- The older refresh-health evaluation `40848128417` is superseded by the
  healthy current-window evaluation recorded above; historical warning data is
  retained for audit continuity and is not the current decision surface.
- PR #712's shared Chinese translation runtime is deployed in the current
  baseline. The live `/api/translation` smoke returned HTTP 200 with an AWS
  Simplified Chinese response; provider policy and linguistic acceptance are
  not represented as a completed pilot gate.
- PR #715's public language-selector fix is also deployed in that baseline;
  the selector is present beside “Sign in” on the direct origin and public
  homepage, and production smoke `40850990485` passed.

## Deliberately not claimed

- Distributed multi-instance rate-limit behavior is enabled and verified by
  guarded workflow `40220255833`; App Runner configuration update and live
  postflight passed. The memory-degraded provider remains the explicit local
  fallback when distributed mode is unset.
- Backup/restore rehearsal and rollback rehearsal remain separate operator
  gates; the provider's Free Plan does not supply evidence for them
  automatically. Refresh-worker cadence is proven, but freshness remains a
  warning until the bounded AWS window rolls forward and AWS reflects at least
  three current in-budget samples; alert evaluation is not enabled in
  production.
- Export/delete behavior remains review-only and is not represented as a
  completed destructive pilot capability.
- Protocol surfaces explicitly documented as partial (for example OTLP/gRPC,
  proxy/stdio launcher ownership, and full durable task lifecycle) remain
  bounded rather than overclaimed.
- Release-owner scope approval and final first-100-user go/no-go remain open.

## Next execution order

1. Record provider backup/restore posture and the release-owner scope/go/no-go
   decision; do not infer either from green CI.
2. Recover the unauthenticated sign-in host, then complete Google/GitHub
   onboarding and device-flow return-path checks using the configured providers.
3. Verify server adoption and fresh telemetry with the rotated replacement key
   in a disposable process, without recording the secret.
4. Keep partial MCP protocol surfaces and review-only deletion visibly bounded
   in docs and setup until their external dependencies or implementations are
   complete.
5. Enable alert evaluation only after the dedicated token, canary destination,
   and delivery acceptance evidence are available.
6. Re-run lint, build, the full release gate, and production smoke after every
   runtime change, then update this file and `docs/codex-handoff/PENDING_WORK.md`.

## Evidence locations

- Acceptance matrix and open work: `FOUNDER-OS-100-CUSTOMER-PILOT-WORK-QUEUE.md`
- Detailed implementation/readiness history: `FOUNDER-OS-100-CUSTOMER-PILOT-READINESS-PLAN.md`
- Session handoff ledger: `docs/codex-handoff/PENDING_WORK.md`
- Redacted local artifacts: `tmp/` (never commit secrets or raw credentials)

The release remains in active autonomous execution until the open gates above
are either verified or explicitly recorded as launch exclusions by the release
owner.
