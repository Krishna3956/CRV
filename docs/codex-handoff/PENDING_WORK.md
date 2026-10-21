# Codex handoff: pending work

Priority follows `FOUNDER-OS-LAUNCH-READINESS-AUDIT.md`,
`FOUNDER-OS-100-CUSTOMER-PILOT-WORK-QUEUE.md`, and
`docs/FOUNDER-OS-100-CUSTOMER-PILOT-RUNBOOK.md`.

## Production gates still open

The work queue currently contains 232 checked items and 31 unchecked items.
Unchecked items include:

- final pilot scope/go-no-go and release-owner record;
- production migration execution record and postflight for identity, read
  models, CLI authorization, rate limits, refresh jobs, catalogs, queue links,
  and privacy paths;
- disposable production CLI activation, signup/signin return, workspace
  selection/creation, approval, redemption, key status, and first ingest;
- cross-workspace negative authorization and key create/use/rotate/revoke;
- exact published package provenance and clean consumers;
- a non-empty worker batch with lag/retry/terminal evidence (the latest run was
  idle and cannot close this gate);
- distributed rate-limit evidence if that capability is claimed;
- deployment-class load/failure recovery and rollback rehearsal.

The exact queue references include items 141-148, 156-157, 178-179, and
249-260. A queue tick is local engineering evidence, not production approval.

## Engineering gaps

1. **Refresh job enqueue path is implemented.** Ingest now enqueues the four
   bounded non-destructive refresh kinds by default after accepted telemetry;
   `TRACKMCP_ENABLE_REFRESH_JOBS=false` is an explicit maintenance/rollback
   opt-out. The enqueue remains fail-open and idempotent, and the worker still
   requires the reviewed migration plus service-role execution. Production
   queue postflight and a non-empty worker batch remain open evidence gates.
2. **The complete PDF product remains incomplete.** Proxy/stdio fallback,
   OTLP/gRPC, full subscriptions, progress/cancellation, completions, sampling,
   elicitation, and complete task lifecycle are partial or missing in the PDF
   audit and protocol matrix.
3. **Setup is not one unified server/environment wizard.** CLI activation and
   dashboard setup exist separately; the PDF's full server/environment/key/
   privacy/first-event flow remains partial.
4. **Deletion execution is review-only/fail-closed.** Export and request/review
   paths exist; approved destructive deletion is not proven.
5. **Rate limiting defaults to memory-degraded** unless Supabase mode is
   deliberately enabled and postflighted.
6. **Package release drift needs review.** Registry evidence records SDK 0.1.2,
   CLI 0.1.4, and Python 0.1.4; later local package commits exist. Do not call
   unreleased local code registry parity.
7. **Branch/release reconciliation is needed.** Run `git log --graph --all`
   and identify the intended release line before more publishing.

## Documentation and verification follow-ups

- Update stale ledgers that say the refresh worker has never run; cite
  `39311968261` and retain its empty-queue caveat.
- Add redacted evidence for a non-empty production batch.
- Re-run the complete release gate from a clean checkout of the exact intended
  SHA before another release decision.
- Perform browser QA for device approval, signup return, empty/loading/
  insufficient/error states, desktop layout, and keyboard focus.
- Reconcile PDF claims with public docs, release notes, and registry versions.
