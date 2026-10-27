# TrackMCP .NET SDK

Transport-neutral, fail-open telemetry primitives for ASP.NET and .NET MCP servers. Use `Capture` at the MCP middleware boundary and flush during graceful shutdown.

When available, set `ServerVersion`, `SdkVersion`, and `DeploymentId` on
`TrackMcpOptions` to attach bounded release metadata to captured events. These
labels are metadata only; they are not customer identity or deployment-health
claims.

The .NET SDK is currently a reviewed source package, not a published NuGet
release. Keep `TRACKMCP_KEY` in your server secret store and use the pinned
project reference documented at `/docs/dotnet`. Capture only bounded,
privacy-safe metadata: never send API keys, OAuth tokens, prompts, results,
URLs, or raw customer identifiers. Account identity must come from an
application-validated claim and is hashed before persistence. TrackMCP does not
implement OAuth or parse bearer tokens. Capture and delivery are fail-open so
telemetry failures do not block MCP requests.

Pass `AccountIdResolver` in `TrackMcpOptions` to enable resolver-linked
account analytics. Return only a stable, already validated tenant/account
handle; the SDK rejects credential-like values, hashes accepted values locally,
and records only `account_identity_source` (`resolver` or `unresolved`).

For disconnects outside an MCP request, call
`client.RecordTransportFailure("transport_closed", sessionId, durationMs)` or
`client.RecordTransportFailure("transport_error", sessionId, durationMs)`. The
observer emits bounded session metadata only; exception text, URLs, headers,
and payloads are never accepted.
For an explicit caller-verified transport label, use
`RecordTransportFailureForTransport` with `stdio`, `streamable_http`, `sse`,
or `custom`; the SDK does not inspect transport internals.

After the caller has actually re-established a transport, it may record
`RecordSessionReconnected(transport, sessionId, durationMs)`. This is bounded,
caller-observed evidence only and does not claim replay or durable delivery.

For protocol notifications, call `RecordProtocolSignal` with one of the
allowlisted signals (`progress`, `cancelled`, `catalog_changed`,
`resource_changed`, `prompt_changed`, `subscription_started`, or
`subscription_stopped`). It records only the signal and method metadata;
progress values, cancellation reasons, subscription identifiers, URIs, and
payloads are never accepted.
The optional `direction` argument defaults to `server_to_client`; pass
`client_to_server` for an inbound cancellation or other client-originated
notification. Invalid directions are ignored.
Use `RecordProtocolSignalForTransport` when the server boundary can verify
`stdio`, `streamable_http`, `sse`, or `custom`; only that bounded label is
retained.

For MRTR/task responses, call `RecordProtocolResult` with the bounded
`JsonObject` result. It emits only the allowlisted result discriminator, task
status, and request/response counts; result content and input values are never
queued. When the host can verify transport, use
`RecordProtocolResultForTransport` with `stdio`, `streamable_http`, `sse`, or
`custom`; unknown labels are rejected.

For an HTTP authorization response, call `RecordAuthorizationOutcome` with
`401` or `403`. The SDK records only `unauthorized` or `forbidden` metadata and
never accepts or stores `WWW-Authenticate` values, resource-metadata URLs,
bearer tokens, or provider error text. OAuth discovery, token exchange,
refresh, and consent remain caller-owned.

For `completion/complete`, it additionally emits bounded friction metadata
(`completion_value_count` up to 32, `completion_total` up to 1,000,000, and
`completion_has_more`). Completion suggestion values and arguments are never
queued.

For `elicitation/create`, `RecordProtocolResult` retains only an explicit
`accept`, `decline`, or `cancel` decision. Questions, schemas, submitted
values, and returned content are never queued; an `accept` is not a business
approval claim.

For a `tools/list`, `resources/list`, `resources/templates/list`, or
`prompts/list` response, call `client.RecordCatalog(kind, method, result,
sessionId)`. It records the bounded page count, SHA-256 identity hashes, and
whether an opaque next cursor was present; names, URIs, schemas, descriptions,
and cursor values are never queued. Repeated calls remain safe for paginated
observation because the cursor itself is intentionally not persisted.
Bounded `ttlMs`/`cacheScope` hints are retained only as `cache_ttl_ms` and
`cache_scope` (`public` or `private`); they do not create authorization or
snapshot guarantees.

For privacy-safe entity reads, call `RecordEntityRead("resources", "resources/read", uri, result, sessionId)` or the equivalent `prompts/get` form. Only a SHA-256 identity hash, bounded content/message count, and result state are emitted; URI, prompt arguments, and returned content are never queued or sent.

After configuring the key, make one real MCP tool call, flush during shutdown
or after a bounded batch, and confirm the event in Setup. Key creation alone
never counts as telemetry.
