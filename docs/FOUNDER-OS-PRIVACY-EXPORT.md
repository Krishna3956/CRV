# Founder OS privacy export contract

The authenticated `GET /api/v1/account/export` route is the first customer-
visible privacy control in Founder OS. It exports the signed-in user's profile,
workspace memberships, bounded telemetry dimensions, semantic facts, and action
queue records, catalog-version metadata, and first-accepted-ingest milestones.
It is read-only and does not issue, rotate, or revoke keys.

The export also includes the bounded catalog entity-read projection. It contains
only source-event references, protocol kind, caller-verified transport labels,
SHA-256 identity hashes, bounded read outcome fields, and timestamps. Unsupported
or legacy transport values are exported as `unknown`. Raw resource URIs, prompt
names, request arguments, and returned content are never exported.

## Safety boundary

The projection intentionally omits raw event `payload`, `account_key`, API-key
hash/prefix material, device/user-code hashes, auth tokens, and any other secret
material. The export is bounded to 500 rows per dataset (the default is 100),
and every response states whether that bound truncated a dataset. Support can
produce a larger archive through a separately reviewed process; the public API
does not provide an unbounded query.

The `semantic`, `dimensions`, `measures`, and action `evidence` objects are
bounded derived data. They may contain product interpretations and are labeled
as such; they are not proof of a user's identity or a verified business
outcome. Catalog exports contain only bounded identifier hashes and counts;
raw catalog names, URIs, and the legacy raw `catalog` object are excluded.

## Deletion gap and operator workflow

Deletion is intentionally not implemented as an HTTP `DELETE` in this slice.
Telemetry, derived facts, action queue rows, workspace membership, and billing
or auth records have different retention and ownership rules. A destructive
endpoint without an approved workspace-owner confirmation, audit trail, and
retention exception policy would be unsafe. Until that workflow exists,
customers can request deletion via `privacy@trackmcp.com`; operators must use
the retention dry-run and record the affected datasets before executing a
transactional cleanup.

The `trackmcp_privacy_requests` table is now the request and review record. It
does not itself delete anything. The companion deletion-plan boundary creates
an explicit, workspace-scoped, bounded dry-run plan only for `approved` or
`processing` requests. The plan covers events, derived facts, action signals,
refresh jobs, activation milestones, and catalog versions; it never includes
API keys, raw payloads, auth tokens, or device-code material. Any future
executor must require an operator confirmation, process one bounded batch at a
time, fence each batch to the request's workspace, and record an audit result.

The review-only migration
`20261018000012_privacy_deletion_batches.sql` adds the audit-record boundary
for those batches. It stores request/workspace scope, dataset, bounded cursor,
counts, lifecycle status, and redacted error metadata behind service-role-only
access. It does not delete rows, and it intentionally keeps `dry_run` true
until a destructive adapter and legal-hold policy are separately approved.
Run its paired postflight query after an operator applies the migration; do not
use the postflight as evidence that deletion itself has executed.

This boundary is intentionally not an HTTP `DELETE` endpoint and has no
database adapter yet. It is a safe contract for a separately reviewed worker.
Until that worker is approved, operators should use the plan as a dry run and
continue to follow the retention and legal-hold policy before any destructive
action.

The pure deletion coordinator also exposes a deterministic checkpoint
contract: one dataset is processed at a time, each query is bounded by the
approved batch size, and a worker resumes from a bounded `after_id` cursor
after interruption. It does not perform deletion or mark a request complete;
those actions remain inside the separately reviewed worker boundary. The
current plan type is always `dry_run: true`, and its execution guard therefore
returns false even when an operator passes a confirmation value; this is an
intentional fail-closed state until a destructive adapter and audit contract
are reviewed.

The preview worker at
`src/lib/account/privacy-deletion-preview-worker.ts` now provides the safe
operational rehearsal for that boundary. It can read bounded batches through an
injected preview-only adapter, persist bounded audit records, resume from the
checkpoint, and stop on cancellation. Its interface has no delete operation,
and its policy explicitly reports `destructiveOperations: false`; it is not
evidence that production deletion is enabled.

## Verification

The pure projection contract is covered by
`src/lib/account/privacy-export.test.ts`. Route-level tests should be added
once the application has a stable Supabase test seam; they must prove that a
member cannot select another workspace and that secret columns cannot appear
in the response.

For CLI redemption recovery, the service now accepts the client-generated
`redemption_id` and stores only its SHA-256 hash after the atomic session claim.
The review-only migration `20261018000013_cli_redemption_idempotency.sql` and
its postflight query cover that column and index. This prevents a conflicting
retry identity from being treated as the same redemption; it does not store or
reveal a raw API key after a lost response.
