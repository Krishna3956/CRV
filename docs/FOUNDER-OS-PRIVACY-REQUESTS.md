# Founder OS privacy deletion requests

The account export is read-only. A deletion request is deliberately a separate,
reviewed workflow: `POST /api/v1/account/privacy-request` records a request and
returns its status, but it never deletes telemetry, derived facts, workspaces,
memberships, billing records, authentication records, or API keys.

## Safety contract

Requests are scoped to the authenticated requester and an optional workspace for
which that requester has membership. Every request requires a bounded
idempotency key, and the JSON request body is capped at 4 KiB before parsing or
persistence. The database stores only bounded reason/audit metadata; it must
never contain raw API keys, tokens, event payloads, or an export archive.

The lifecycle is:

`requested → under_review → approved → processing → completed`

Review may reject or cancel a request. Terminal states cannot be reopened, and
the public status response omits reviewer identity, internal notes, and
idempotency material. The review service must verify workspace ownership,
retention/legal exceptions, dependencies, and a second-person approval before
any destructive operation is introduced.

## Operational boundary

The migration is review-only and additive. It enables no direct `anon` or
`authenticated` table access; the server-side service role is the only path for
the future review worker. Until a documented deletion plan, audit log, dry-run,
legal-hold handling, and transactional worker exist, operators should continue
to process requests through the existing retention runbook rather than invoking
SQL deletes.

## Review queue boundary

The internal route `POST /api/internal/privacy/review` now provides the
non-destructive operator transition boundary. It is protected by the
server-only `TRACKMCP_PRIVACY_REVIEW_SECRET`, uses timing-safe bearer-token
comparison, accepts only bounded request IDs, statuses, and notes, and requires
an optimistic status predicate when saving a transition. `GET` lists a bounded
review queue with `no-store` caching. The projection omits idempotency keys,
requester/reviewer identities, payloads, and secrets.

The route may move requests through review, approval, rejection, processing, or
cancellation. It deliberately refuses `completed`: completion requires a
separately reviewed asynchronous deletion worker, legal-hold policy, and
postflight evidence. This route records review state; it does not delete data.

## Legal-hold and retention decision inputs

Before a future destructive adapter can be designed, the operator record must
resolve all of these bounded inputs:

- request scope is an explicit workspace scope, not an inferred account-wide scope;
- legal hold is explicitly `clear`;
- retention exception is explicitly `none`;
- dependency review is explicitly `clear`;
- a distinct second approver is recorded using a bounded operator identifier.

Unknown, active, blocked, or missing values fail closed. The review-only policy
implementation is `src/lib/account/privacy-legal-hold.ts`; it does not read the
database or perform deletion. Its output is a small list of blocker categories,
never request content or operator identity material.

Migration: `supabase/migrations/20261018000007_privacy_requests.sql`.
Postflight: `supabase/manual/founder-os-privacy-requests-postflight.sql`.
