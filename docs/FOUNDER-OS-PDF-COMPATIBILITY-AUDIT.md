# Founder OS PDF compatibility audit

This document records the protocol and product-contract review against the Founder OS source PDF. It separates what the current implementation can observe from what it must not claim.

## Closed in this pass

### Multi-round-trip outcomes

MCP `resources/read` and `prompts/get` may return `resultType: input_required` before a later retry completes. The event contract now accepts a bounded `result_type` and classifies it as a pending/stalled outcome. `is_error` remains a separate hard-error axis; an errored result is never counted as a normal stall.

For older events that omit `resultType`, `resources/read` and `prompts/get` default to `complete`, matching the backward-compatibility rule in the PDF. Other event families do not infer completion from absence.

### Retry linkage without payload capture

The event contract now supports:

- opaque `interaction_id`
- `retry_of_event_id`
- SHA-256 `request_state_hash`
- bounded `input_response_count`

Raw `inputResponses`, request state, arguments, and results are not stored. This allows a later projection to collapse a stall/retry chain without retaining user content.

### Resource annotations

Bounded `resource_audience` (`user`/`assistant`) and `resource_priority` (`0..1`) are accepted for segmentation. They are not treated as verified business intent.

### Persistence contract

The ingest projection writes the new fields to `trackmcp_events`; the corresponding review-only migration is:

`supabase/migrations/20261018000009_mcp_round_trip_outcomes.sql`

The migration is additive, has no backfill, and stores no raw protocol input.

## Remaining PDF gaps

These are deliberately not represented as complete merely because a route or field exists:

1. Resource subscriptions (`resources/subscribe`, `notifications/resources/updated`) need a dedicated lifecycle fact rather than being counted as ordinary reads.
2. `resources/templates/list` now has a distinct bounded catalog-observation path: the tester and TypeScript modern client emit/consume `resource_templates` metadata with cursor traversal, without expanding or dereferencing templates. Cross-transport production UAT and durable history evidence remain open.
3. `resources/list_changed` and `prompts/list_changed` need snapshot version events. Snapshot storage exists, but no protocol adapter can claim complete change coverage yet.
4. Completion suggestions (`completion/complete`) need a separate friction event and dashboard metric.
5. JSON-RPC errors, `isError`, `input_required`, and cancellation are separate states. A single success/failure ratio is not sufficient.
6. Cancellation and disconnects are only observable when the integration exposes them; a missing notification must remain unknown, not silently abandoned.
7. Identity from `clientInfo` remains self-reported. Verified account identity requires a customer resolver or validated auth context; TrackMCP must not label it verified automatically.
8. Sampling, elicitation, roots, progress, tasks, pagination, resumability, and resource-indicator security need explicit adapters before they can be exposed as product metrics.

## Product truth

The current implementation can safely support a protocol-aware observability foundation. It cannot yet claim full MCP-spec coverage or complete workflow truth for every transport/client. Dashboard copy should continue to expose evidence quality, freshness, unknown buckets, and unsupported-signal caveats.

## Verification

- TypeScript check passed after the contract changes.
- Semantic, validation, and fact projection tests passed (19 tests).
- `git diff --check` passed.
- No SQL was executed.
- No commit, push, merge, deployment, or package publication was performed.
