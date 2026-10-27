# Founder OS PDF compatibility audit

This document records the protocol and product-contract review against the Founder OS source PDF. It separates what the current implementation can observe from what it must not claim.

## 2026-10-27 — catalog notification and snapshot evidence boundary

Authenticated analytics now exposes bounded notification-family counts by
catalog surface (`tools`, `resources`, `resource_templates`, and `prompts`)
alongside versioned snapshot counts, changed-version counts, computed-diff
counts, and truncation status. The dashboard explicitly labels these as
separate evidence streams: a notification never manufactures or implies a
snapshot version. Snapshot summaries are page-bounded and retain the existing
hash-only privacy boundary. The remaining gap is a reviewed server-side
notification-to-snapshot correlation contract plus authenticated
cross-transport UAT; no correlation is claimed here.

## 2026-10-27 — completion request/result evidence

Authenticated analytics now reports completion requests, explicitly matched
request/response pairs, unmatched requests, and whether the completion
capability was advertised in the same bounded service/environment evidence.
The dashboard keeps suggestion counts, empty results, and partial results
separate. Matching uses only an already-hashed explicit interaction handle;
values, prompt/resource references, and arguments remain unavailable. Broader
multi-transport runtime and authenticated UAT remain open.

## 2026-10-27 — explicit elicitation decision evidence

The TypeScript and Python client observers now retain only the allowlisted
elicitation decisions `accept`, `decline`, and `cancel` in metadata. Analytics
counts those decisions separately for elicitation and sampling and never
retains submitted values or content. An observed protocol `accept` is not
presented as business approval. Broader cross-language runtime fixtures and
authenticated UAT remain open.

The Go and .NET observers now apply the same allowlist for protocol decisions;
their hosted compile/smoke gate remains the authoritative runtime evidence in
this workspace because the local Go and .NET toolchains are unavailable.

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

### Cross-language subscription signal parity

The TypeScript, Python, Go, and .NET SDKs now expose the same bounded
`subscription_started` and `subscription_stopped` signal vocabulary for
legacy resource subscriptions and modern subscription streams. The APIs accept
only the signal and method metadata; subscription identifiers, resource URIs,
notification contents, and payload values are never captured. This improves
exporter parity but does not turn the signals into a durable subscription
entity or claim replay/reconnect ownership.

### Dedicated lifecycle fact boundary

Allowlisted protocol signals now project to the explicit durable fact category
`lifecycle`, rather than being mixed with generic observations. This makes
subscription start/stop, progress, cancellation, resource changes, and catalog
change activity distinguishable in downstream analytics while preserving the
same metadata-only privacy boundary. The additive migration widens only the
semantic-fact type constraint and performs no backfill.

### Cross-language catalog-page parity

The TypeScript and Python exporters already project bounded catalog pages; Go
and .NET now expose the same `RecordCatalog` boundary for tools, resources,
resource templates, and prompts. Each exporter retains only a bounded count,
one-way SHA-256 identity hashes, and opaque-cursor presence. Cursor values,
names, URIs, schemas, descriptions, and payloads remain excluded. This closes
the SDK parity gap without claiming transport-owned pagination or production
UAT.

### Explicit protocol signal direction

Protocol-signal APIs across TypeScript, Python, Go, and .NET now validate and
retain only the bounded direction values `server_to_client` and
`client_to_server`. This prevents an inbound cancellation from being
misreported as a server notification while keeping request IDs, reasons, and
payload values out of telemetry. Transport-specific runtime fixtures and
production UAT remain separate evidence gates.

### Python middleware notification boundary

The official Python middleware now routes inbound progress, cancellation, and
catalog list-change notifications through the same allowlisted signal helper
used by direct SDK calls. Request IDs, cancellation reasons, progress values,
and notification payloads are therefore excluded instead of entering the
generic protocol projection. Go/.NET transport-boundary fixtures and
production UAT remain separate evidence gates.

## Remaining PDF gaps

These are deliberately not represented as complete merely because a route or field exists:

1. Resource subscriptions (`resources/subscribe`, `notifications/resources/updated`) now project a dedicated bounded lifecycle fact discriminator (`subscription_action`) rather than being counted as ordinary reads; authenticated cross-transport lifecycle UAT remains open.
2. `resources/templates/list` now has a distinct bounded catalog-observation path: the tester and TypeScript modern client emit/consume `resource_templates` metadata with cursor traversal, without expanding or dereferencing templates. Cross-transport production UAT and durable history evidence remain open.
3. `resources/list_changed`, `tools/list_changed`, and `prompts/list_changed` now retain a bounded catalog-kind discriminator in lifecycle facts. Snapshot storage exists, but notifications still do not manufacture a snapshot version; authenticated cross-transport change-to-snapshot UAT remains open.
4. Completion suggestions (`completion/complete`) now have a separate bounded friction metric and durable semantic-fact measures (count/total/hasMore plus request/response role); broader runtime fixtures and authenticated production UAT remain open, and suggestion values are unavailable by design.
5. JSON-RPC errors, `isError`, `input_required`, and cancellation are separate states. A single success/failure ratio is not sufficient.
6. Cancellation and disconnects are only observable when the integration exposes them; a missing notification must remain unknown, not silently abandoned.
7. Identity from `clientInfo` remains self-reported. Verified account identity requires a customer resolver or validated auth context; TrackMCP must not label it verified automatically.
8. Sampling, elicitation, roots, progress, tasks, pagination, resumability, and resource-indicator security need explicit adapters before they can be exposed as product metrics.

## Product truth

The current implementation can safely support a protocol-aware observability foundation. It cannot yet claim full MCP-spec coverage or complete workflow truth for every transport/client. Dashboard copy should continue to expose evidence quality, freshness, unknown buckets, and unsupported-signal caveats.

## Verification

- TypeScript and Python SDK checks passed after the cross-language signal
  parity changes; Go and .NET source contracts are covered by the hosted
  package gate.
- Semantic, validation, and fact projection tests passed (19 tests).
- `git diff --check` passed.
- No SQL was executed.
- No commit, push, merge, deployment, or package publication was performed.
