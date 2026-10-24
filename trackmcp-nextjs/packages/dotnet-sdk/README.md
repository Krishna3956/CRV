# TrackMCP .NET SDK

Transport-neutral, fail-open telemetry primitives for ASP.NET and .NET MCP servers. Use `Capture` at the MCP middleware boundary and flush during graceful shutdown.

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

For protocol notifications, call `RecordProtocolSignal` with one of the
allowlisted signals (`progress`, `cancelled`, `catalog_changed`,
`resource_changed`, `prompt_changed`, `subscription_started`, or
`subscription_stopped`). It records only the signal and method metadata;
progress values, cancellation reasons, subscription identifiers, URIs, and
payloads are never accepted.

For MRTR/task responses, call `RecordProtocolResult` with the bounded
`JsonObject` result. It emits only the allowlisted result discriminator, task
status, and request/response counts; result content and input values are never
queued.

For `completion/complete`, it additionally emits bounded friction metadata
(`completion_value_count` up to 32, `completion_total` up to 1,000,000, and
`completion_has_more`). Completion suggestion values and arguments are never
queued.

For a `tools/list`, `resources/list`, `resources/templates/list`, or
`prompts/list` response, call `client.RecordCatalog(kind, method, result,
sessionId)`. It records the bounded page count, SHA-256 identity hashes, and
whether an opaque next cursor was present; names, URIs, schemas, descriptions,
and cursor values are never queued. Repeated calls remain safe for paginated
observation because the cursor itself is intentionally not persisted.

After configuring the key, make one real MCP tool call, flush during shutdown
or after a bounded batch, and confirm the event in Setup. Key creation alone
never counts as telemetry.
