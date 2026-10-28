# Founder OS: 100-customer pilot status

Last verified: 2026-10-28 (Asia/Kolkata)

This is the concise release-owner handoff. It records evidence that exists,
what is intentionally not claimed, and the next work queue. It is not a
promise that every product capability is complete.

## Verified and shipped

- `origin/main` is `HEAD` (active pilot evidence baseline). The latest deployed
  application runtime is immutable `dde5e94d44c665b20033ed3b2ab56e5accc593a4`
  via App Runner workflow `40689262786`, with read-only production smoke,
  immutable identity, and runtime-safety checks passed. Hosted TrackMCP CI
  `40689262784` passed 147 cross-language suites, and authenticated production
  smoke `40690377977` passed against the same release. AWS worker freshness
  remains proven by health artifact `40629348992`; the alert evaluator path is
  published but manual-only and disabled-first.
- The latest local release gate passes 147 suites, lint, the 178-route
  production build, and `git diff --check`.
- Production schema postflights verified required tables, indexes, functions,
  RLS/privilege boundaries, constraints, integrity aggregates, and catalog
  entity-read privacy checks with zero invalid rows in the audited sets.
- The public Security page now discloses the backup/recovery boundary; it does
  not claim schedules, PITR, restore testing, or restoration ownership that the
  selected provider plan does not supply.
- Local lint, build (178 routes), and the complete 145-suite release gate pass.
- SDK/CLI/Python/Go/.NET consumer, OTLP JSON/protobuf, protocol observer,
  tenant-isolation, privacy, accessibility, and documentation-navigation
  checks are green.
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
