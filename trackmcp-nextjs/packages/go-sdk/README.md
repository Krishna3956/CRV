# TrackMCP Go SDK

Fail-open telemetry primitives for Go MCP servers. Capture protocol envelopes at the server or transport boundary and call `Flush` during graceful shutdown. The package has no dependencies outside the Go standard library.

The Go SDK is currently a reviewed source package, not a published registry
release. Keep `TRACKMCP_KEY` in your secret manager and use the pinned source
checkout documented at `/docs/go`. Capture only bounded, privacy-safe metadata:
never send API keys, OAuth tokens, prompts, results, URLs, or raw customer
identifiers. Account identity is optional and must be an application-validated
claim; the service hashes it before persistence. TrackMCP does not implement
OAuth or inspect bearer tokens. Delivery is asynchronous and fail-open, so a
telemetry failure must not block an MCP request.

For disconnects outside an MCP request, call
`client.RecordTransportFailure("transport_closed", sessionID, durationMS)` or
`client.RecordTransportFailure("transport_error", sessionID, durationMS)`. The
hook records bounded session metadata only and remains fail-open; exception
text, URLs, headers, and payloads are never accepted.

After configuring the key, make one real tool call, flush, and confirm the
event in Setup. Key acceptance alone is not proof that telemetry arrived.
