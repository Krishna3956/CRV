# Founder OS privacy deletion worker design review

Status: **design only; execution closed**  
Review version: `2026-10-19.v1`

This document defines the minimum contract for a future destructive deletion
worker. It is not an implementation, migration, SQL script, or authorization
to remove data. The current application must continue to refuse `completed`
until this design is implemented, reviewed, and proven in an approved
environment.

## Preconditions (all fail closed)

The worker may not claim eligibility unless one immutable review record proves:

1. the request is authenticated, approved, and scoped to exactly one workspace;
2. legal hold is explicitly `clear`;
3. retention exception is explicitly `none`;
4. dependencies and contractual holds are explicitly `clear`;
5. a distinct second approver is recorded;
6. the requested scope is mapped to an allowlisted dataset list;
7. a dry-run preview has a bounded count, oldest/newest timestamps, and a
   reviewed checksum or version;
8. the operator has named a rollback owner and an incident channel.

Missing, stale, ambiguous, or oversized values are blockers. Operator
confirmation alone cannot override a blocker.

## State machine

`requested → under_review → approved → previewed → processing → completed`

`rejected`, `cancelled`, and `failed` are terminal. A terminal request cannot
be reopened or silently retried. A retry creates a new bounded execution
attempt linked to the original request and preserves the prior audit record.

## Execution contract

- Use a fixed dataset allowlist and a deterministic dataset order.
- Process at most 500 rows per batch and use a bounded, monotonic cursor.
- Persist an idempotency key for every batch; a replay must not process a batch
  twice.
- Fence the worker with a lease owner and expiry so a stale worker cannot
  advance the request.
- Verify workspace scope in every batch predicate; never trust a caller's
  workspace query parameter.
- Record only request ID, workspace ID, dataset, batch number, counts, cursor
  hash, timestamps, state, and bounded error categories. Never record keys,
  tokens, payloads, or row contents.
- Stop at the first failed safety check or transaction and leave the request in
  a recoverable non-terminal state.
- Complete only after every dataset reports a verified terminal batch and a
  postflight proves the scoped result. A successful worker process is not proof
  of completion.

## Audit and recovery

The audit trail must answer who approved, who executed, which scope/version was
used, which batches were observed, what failed, and what postflight proved. It
must be append-only to the extent supported by the chosen audit store. Recovery
must resume from a bounded checkpoint or safely stop; it must never guess a
cursor or widen scope after a restart.

Before production enablement, the release owner must review a disposable
workspace run, a cancellation/restart run, a stale-lease run, a replayed batch,
an injected transaction failure, and the final postflight. The rollback plan
must preserve additive schema compatibility and must not restore deleted
customer data from an unreviewed backup.

## Explicit non-goals

The current review endpoint does not execute this design. The current dry-run
planner remains the only deletion plan and `canExecutePrivacyDeletionPlan`
remains false. No operator should simulate completion by editing a request row
or by running ad-hoc destructive SQL.
