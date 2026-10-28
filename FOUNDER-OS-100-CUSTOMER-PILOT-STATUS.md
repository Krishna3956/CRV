# Founder OS: 100-customer pilot status

Last verified: 2026-10-28 (Asia/Kolkata)

This is the concise release-owner handoff. It records evidence that exists,
what is intentionally not claimed, and the next work queue. It is not a
promise that every product capability is complete.

## Verified and shipped

- `origin/main` is `HEAD` (active pilot evidence baseline). The latest deployed
  application runtime is immutable `8e3b61836432e1b045b539857fb8639d9d464c3f`
  via App Runner workflow `40695080113`, with release gate, read-only
  production smoke, immutable identity, and runtime-safety checks passed. The
  deployed image digest is
  `sha256:bb8c89a7a3794b83c129681310e423e007c9096cba9f4398cf84ebf3392d8cb0`.
  Hosted TrackMCP CI `40702831003` passed across the web/JavaScript, Go, and
  .NET lanes, and the live health endpoint reports the same release SHA. AWS
  worker freshness remains proven by health artifact `40629348992`; the alert
  evaluator path is published but manual-only and disabled-first.
- The latest local release gate passes 148 suites, lint, the 178-route
  production build, and `git diff --check`.
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

## Deliberately not claimed

- Distributed multi-instance rate-limit behavior is enabled and verified by
  guarded workflow `40220255833`; App Runner configuration update and live
  postflight passed. The memory-degraded provider remains the explicit local
  fallback when distributed mode is unset.
- Backup/restore rehearsal and rollback rehearsal remain separate operator
  gates; the provider's Free Plan does not supply evidence for them
  automatically. Refresh-worker freshness is proven by the current AWS health
  artifact; alert evaluation is not enabled in production.
- Export/delete behavior remains review-only and is not represented as a
  completed destructive pilot capability.
- Protocol surfaces explicitly documented as partial (for example OTLP/gRPC,
  proxy/stdio launcher ownership, and full durable task lifecycle) remain
  bounded rather than overclaimed.
- Release-owner scope approval and final first-100-user go/no-go remain open.

## Next execution order

1. Record provider backup/restore posture and the release-owner scope/go/no-go
   decision; do not infer either from green CI.
2. Verify server adoption and fresh telemetry with the rotated replacement key
   in a disposable process, without recording the secret.
3. Keep partial MCP protocol surfaces and review-only deletion visibly bounded
   in docs and setup until their external dependencies or implementations are
   complete.
4. Enable alert evaluation only after the dedicated token, canary destination,
   and delivery acceptance evidence are available.
5. Re-run lint, build, the full release gate, and production smoke after every
   runtime change, then update this file and `docs/codex-handoff/PENDING_WORK.md`.

## Evidence locations

- Acceptance matrix and open work: `FOUNDER-OS-100-CUSTOMER-PILOT-WORK-QUEUE.md`
- Detailed implementation/readiness history: `FOUNDER-OS-100-CUSTOMER-PILOT-READINESS-PLAN.md`
- Session handoff ledger: `docs/codex-handoff/PENDING_WORK.md`
- Redacted local artifacts: `tmp/` (never commit secrets or raw credentials)

The release remains in active autonomous execution until the open gates above
are either verified or explicitly recorded as launch exclusions by the release
owner.
