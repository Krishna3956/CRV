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

For disconnects outside an MCP request, call
`client.RecordTransportFailure("transport_closed", sessionId, durationMs)` or
`client.RecordTransportFailure("transport_error", sessionId, durationMs)`. The
observer emits bounded session metadata only; exception text, URLs, headers,
and payloads are never accepted.

For protocol notifications, call `RecordProtocolSignal` with one of the
allowlisted signals (`progress`, `cancelled`, `catalog_changed`,
`resource_changed`, or `prompt_changed`). It records only the signal and
method metadata; progress values, cancellation reasons, URIs, and payloads
are never accepted.

For MRTR/task responses, call `RecordProtocolResult` with the bounded
`JsonObject` result. It emits only the allowlisted result discriminator, task
status, and request/response counts; result content and input values are never
queued.

After configuring the key, make one real MCP tool call, flush during shutdown
or after a bounded batch, and confirm the event in Setup. Key creation alone
never counts as telemetry.
