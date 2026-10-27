# TrackMCP Go SDK

Fail-open telemetry primitives for Go MCP servers. Capture protocol envelopes at the server or transport boundary and call `Flush` during graceful shutdown. The package has no dependencies outside the Go standard library.

Set `Options.ServerVersion`, `Options.SDKVersion`, and `Options.DeploymentID`
when those bounded release labels are known. They are copied to each event as
metadata only; they are not used as customer identity or health claims.

The Go SDK is currently a reviewed source package, not a published registry
release. Keep `TRACKMCP_KEY` in your secret manager and use the pinned source
checkout documented at `/docs/go`. Capture only bounded, privacy-safe metadata:
never send API keys, OAuth tokens, prompts, results, URLs, or raw customer
identifiers. Account identity is optional and must be an application-validated
claim; set `Options.AccountIDResolver` to return that claim and the SDK hashes
it locally before queueing. TrackMCP does not implement
OAuth or inspect bearer tokens. Delivery is asynchronous and fail-open, so a
telemetry failure must not block an MCP request.

For graceful shutdown, `client.Flush()` uses the default HTTP client. If the
host owns a cancellation context or transport, provide `Options.HTTPClient`
and call `client.FlushContext(ctx)`. Cancellation, non-2xx responses, request
construction failures, and serialization failures return an error for
diagnostics and put the bounded batch back at the front of the queue for a
later retry; telemetry remains fail-open.

For disconnects outside an MCP request, call
`client.RecordTransportFailure("transport_closed", sessionID, durationMS)` or
`client.RecordTransportFailure("transport_error", sessionID, durationMS)`. The
hook records bounded session metadata only and remains fail-open; exception
text, URLs, headers, and payloads are never accepted.
For an explicit caller-verified transport label, use
`RecordTransportFailureForTransport` with `stdio`, `streamable_http`, `sse`,
or `custom`; the SDK does not inspect transport internals.

After the caller has actually re-established a transport, it may record the
bounded lifecycle signal with `client.RecordSessionReconnected(transport,
sessionID, durationMS)`. This is caller-observed evidence only: it does not
claim replay, durable delivery, or transport ownership.

For protocol notifications, call `client.RecordProtocolSignal` with one of
`progress`, `cancelled`, `catalog_changed`, `resource_changed`,
`prompt_changed`, `subscription_started`, or `subscription_stopped`. Only the
allowlisted signal and method metadata are sent; progress values, cancellation
reasons, subscription identifiers, URIs, and payloads are not accepted.
Use `RecordProtocolSignalDirection` with `client_to_server` when recording an
inbound cancellation; direction is validated and persisted as bounded
metadata only. For a caller-verified transport label on the signal, use
`RecordProtocolSignalForTransport` with `stdio`, `streamable_http`, `sse`, or
`custom`; notification values and transport internals remain excluded.

For MRTR/task responses, call `client.RecordProtocolResult` with the response
map. It emits only the allowlisted result discriminator, task status, and
bounded request/response counts; result content and input values are never
queued.

For `completion/complete`, the same call also records bounded friction
metadata (`completion_value_count` up to 32, `completion_total` up to
1,000,000, and `completion_has_more`). Completion suggestion values and
arguments are never queued.

For `elicitation/create`, `RecordProtocolResult` retains only an explicit
`accept`, `decline`, or `cancel` decision. Questions, schemas, submitted
values, and returned content are never queued; an `accept` is not a business
approval claim.

For a `tools/list`, `resources/list`, `resources/templates/list`, or
`prompts/list` response, call `client.RecordCatalog(kind, method, result,
sessionID)`. It records the bounded page count, SHA-256 identity hashes, and
whether an opaque next cursor was present; names, URIs, schemas, descriptions,
and cursor values are never queued. Repeated calls remain safe for paginated
observation because the cursor itself is intentionally not persisted.
Bounded `ttlMs`/`cacheScope` hints are retained as `cache_ttl_ms` and
`cache_scope` only for `public` or `private`; they are freshness and sharing
hints, not authorization or snapshot guarantees.

For privacy-safe entity reads, call `RecordEntityRead("resources", "resources/read", uri, result, sessionID)` or the equivalent `prompts/get` form. Only a SHA-256 identity hash, bounded content/message count, and result state are emitted; URI, prompt arguments, and returned content are never queued or sent.

To enable resolver-linked account analytics, return only a stable, already
validated tenant/account handle. The SDK rejects credential-like values,
hashes accepted values locally, and records `account_identity_source` as
`resolver` or `unresolved`; the raw handle is never queued.

After configuring the key, make one real tool call, flush, and confirm the
event in Setup. Key acceptance alone is not proof that telemetry arrived.
