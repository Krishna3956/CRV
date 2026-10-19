# Founder OS action queue lifecycle

Action-queue rows are bounded investigation signals, not diagnoses. The
evidence is produced by the semantic classifier; an operator may acknowledge,
snooze, or resolve the signal without changing its evidence.

## State contract

| State | Meaning | Operator actions |
| --- | --- | --- |
| `open` | New signal requiring review | acknowledge, snooze, resolve |
| `acknowledged` | An authorized workspace member has seen it | snooze, resolve |
| `snoozed` | Review is intentionally deferred until a bounded UTC time | acknowledge, resolve |
| `resolved` | Operator recorded that the investigation is complete | terminal |

All mutations are workspace-scoped and require an authenticated actor that has
already passed the caller's workspace-membership/role check. The pure service
also checks that the actor workspace matches the row, so an API route cannot
accidentally mutate another workspace by trusting a request body workspace ID.

Lifecycle writes use an optimistic `revision` predicate (`workspace_id`, `id`,
and previous `revision`). A missing updated row is a conflict and should be
returned as `409`, allowing the client to reload instead of overwriting another
operator's action. Repeating the same acknowledge/snooze operation is
idempotent.

Snoozes are limited to 30 days. Resolution notes are limited to 500 characters
and must never contain raw event payloads, API keys, or secrets. The review-only
SQL migration adds only lifecycle metadata and constraints; it does not create
an automatic writer, backfill rows, or delete data.

Implementation: `src/lib/telemetry/action-queue-lifecycle.ts`.

## HTTP mutation contract

The read surface is `GET /api/v1/action-queue`. It is available to signed-in
workspace members, rejects ingest bearer keys, scopes every query to the
authenticated workspace, caps the page size using the shared API policy, and
supports the bounded `status` filters `open`, `acknowledged`, `snoozed`, and
`resolved`. It returns serialized queue metadata and evidence only; raw
transport events are never exposed.

The review surface is exposed at `PATCH /api/v1/action-queue/{id}`. Each
request accepts exactly one bounded action:

```json
{ "action": "acknowledge" }
{ "action": "snooze", "until": "2026-10-25T12:00:00Z" }
{ "action": "resolve", "note": "Investigated and fixed." }
```

The route uses the existing authenticated alert-request path, keeps the row
workspace-scoped, and returns `409` when the supplied revision is stale. A
client should reload and intentionally retry rather than overwrite a
concurrent operator action. Ingest API keys are deliberately rejected for this
human review operation; the caller must be an authenticated dashboard user
with an owner/admin workspace role. The route never accepts event payloads,
arbitrary status values, or a caller-supplied workspace override.

## Alert relationship read model

The versioned `GET /api/v2/action-queue` projection requests the optional
`linked_alerts` relationship. It joins only on the workspace-scoped SHA-256
`action_queue_fingerprint` added by the review-only alert-link migration and
returns bounded incident metadata (state, severity, metric, and timestamps).
If that additive column is not present or the optional join fails, queue rows
remain readable with an empty relationship rather than turning the queue into
a 500. No alert delivery payloads, webhook secrets, or raw telemetry are
returned. Production should treat the relationship as unavailable until the
migration postflight confirms the column, index, and shape constraint.
