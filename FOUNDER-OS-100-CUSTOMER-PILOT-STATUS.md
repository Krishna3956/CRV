# Founder OS: 100-customer pilot status

Last verified: 2026-10-25 (UTC)

This is the concise release-owner handoff. It records evidence that exists,
what is intentionally not claimed, and the next work queue. It is not a
promise that every product capability is complete.

## Verified and shipped

- Main is synchronized to `6f38864` (PRs #356–#362 merged).
- Hosted release CI for PR #359 passed (workflow `40176488160`); web/JavaScript,
  Go, and .NET jobs were green.
- App Runner deployment and read-only public production smoke passed
  for `6f38864` (deployment workflow `40177870518`); the immutable image
  digest was verified and 35 smoke checks passed (33 executed, 2 intentionally
  skipped without a write credential).
- Authenticated production scope smoke passed 37 checks
  against the deployed `6f38864` (redacted report in `tmp/deploy-40177870518/auth-smoke.json`), including key-bound workspace isolation,
  privacy-safe v2/legacy read models, API-key Action Queue denial, and revoked
  key rejection.
- Supabase read-only postflight verified the required tables, RLS, grants,
  RPC execution boundaries, indexes, and constraints.
- Refresh worker passed five bounded batches: 24 processed, 24 succeeded,
  zero retryable/failing jobs, no timeout (workflow `40175504973`).
- Rate-limit cleanup wiring passed its bounded OIDC/App Runner/worker-secret
  check (workflow `40175847485`). This does not prove distributed rate limiting.
- Authenticated device UAT reached workspace selection, approved a disposable
  device session, redeemed a CLI key, accepted one real metadata-only event,
  and reflected the activity in the dashboard. No credential or payload is
  recorded in this document.
- Invalid-code, safe signed-out handoff, valid pending, one-workspace,
  workspace creation, and already-approved browser states have local or
  production evidence as recorded in the work queue.
- The local release gate and packed TypeScript/CLI/Python/Go/.NET consumer
  checks are green in the current candidate.

## Deliberately not claimed

- Key rotation and revocation were not mutated in the browser UAT. They need a
  fresh action-time confirmation before access-changing clicks are performed.
- Fresh production browser evidence for expired, denied, and multiple-membership
  device states is still open even though local contracts cover them.
- Distributed multi-instance rate-limit behavior is not enabled or load-tested.
- Migration backup/restore rehearsal, scheduler execution under production
  load, rollback rehearsal, and package provenance attestations remain separate
  operator gates.
- Export/delete behavior is not represented as a completed pilot capability.
- No npm package was republished during this verification pass.

## Next execution order

1. Capture the remaining device browser states (expired, denied,
   multiple-membership) with disposable test data and redact evidence.
2. Run the key lifecycle mutation smoke (rotate/revoke) only after an
   action-time confirmation for each access-changing operation; verify old-key
   rejection and new-key use.
3. Rehearse migration backup/restore and rollback in a disposable environment;
   record operator, timestamp, candidate SHA, and recovery result.
4. Decide and document the launch posture for distributed rate limiting,
   export/delete, scheduler execution, and package provenance. Keep unsupported
   UI claims hidden until the corresponding gate is green.
5. Re-run the complete release gate and production smoke after any runtime
   change, then update this file and `docs/codex-handoff/PENDING_WORK.md`.

## Evidence locations

- Acceptance matrix and open work: `FOUNDER-OS-100-CUSTOMER-PILOT-WORK-QUEUE.md`
- Detailed implementation/readiness history: `FOUNDER-OS-100-CUSTOMER-PILOT-READINESS-PLAN.md`
- Session handoff ledger: `docs/codex-handoff/PENDING_WORK.md`
- Redacted local artifacts: `tmp/` (never commit secrets or raw credentials)

The release remains in active autonomous execution until the open gates above
are either verified or explicitly recorded as launch exclusions by the release
owner.
