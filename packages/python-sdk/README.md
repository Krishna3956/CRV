# trackmcp

Install the current published package with `python3 -m pip install trackmcp`.
Pin an exact version in your requirements or lockfile when you need
reproducible builds.

When known, pass `server_version`, `sdk_version`, and `deployment_id` to attach
bounded release metadata to events. These labels are metadata only; they are
not customer identity or deployment-health claims.

Correlation is disabled by default and does not change MCP schemas. External mode accepts a synchronous resolver returning an already anonymized opaque handle from bounded request metadata. Invalid, oversized, credential-like, or resolver-failed values are recorded as missing. `correlation_mode="issued"` is exposed for contract parity but is not enabled by the current Python MCP middleware because it has no stable schema-rewrite-and-strip seam; it therefore records missing provenance until a compatible adapter exists. Resolvers must not return emails, tokens, URLs, raw user IDs, prompts, completions, or private reasoning.

For optional verified organization/account reporting, set `account_id_resolver` to read an account or tenant claim already validated by your application. The SDK hashes the bounded result locally into `account_key`; it never parses bearer tokens or uses MCP `clientInfo` as identity. Resolver failures and unsafe values are fail-open and are labeled `account_identity_source="unresolved"`.

Observe the MCP server boundary without capturing a host's private model turn.

Resource and prompt reads are represented as bounded protocol observations. For
`resources/read`, the SDK sends only a SHA-256 hash of the requested URI; for
`prompts/get`, it sends only a SHA-256 hash of the prompt name. The raw URI,
prompt name, arguments, and returned content are not included in these events.
This supports privacy-safe unique-read counts while the dashboard continues to
label entity-level history and read outcomes as limited until durable joins are
available.

Protocol notifications can be recorded with `client.record_protocol_signal`.
The optional `transport` accepts `stdio`, `streamable_http`, `sse`, or `custom`,
and `direction` defaults to `server_to_client` while accepting
`client_to_server` for inbound cancellation; only the allowlisted signal,
transport, direction, and method metadata are retained.

Call `client.record_protocol_result("tools/call", result, transport="streamable_http")` when the host owns
the response boundary and can verify the transport. The optional transport
accepts `stdio`, `streamable_http`, `sse`, or `custom`; it is omitted rather
than guessed when unknown. The helper retains only bounded result/task
discriminators, completion counts, cache hints, and protocol-family metadata;
response bodies, task handles, input values, and arbitrary fields are never
stored.

For an HTTP authorization response, call
`client.record_authorization_outcome("tools/call", 401)` or pass `403`. The
SDK records only `unauthorized` or `forbidden` metadata and never accepts or
stores `WWW-Authenticate` values, resource-metadata URLs, bearer tokens, or
provider error text. OAuth discovery, token exchange, refresh, and consent
remain caller-owned.

The official middleware and the compatibility wrapper used by `with_trackmcp`
apply the same notification boundary. Progress, cancellation, and
tools/resources/prompts list-change calls are classified as metadata-only
signals; notification parameters, reasons, request IDs, and progress values
are never retained.

Events emitted by this server SDK carry `observation_source="server"`. The
P1-04 Node client transport wrapping is TypeScript-only. The Python server
wrapper cannot infer whether the host is stdio or Streamable HTTP, so pass the
known transport explicitly when configuring it (for example,
`transport="stdio"`). That bounded value is copied to emitted events; when it
is omitted, transport remains unknown rather than being guessed. Python client
transports are not supported in that workstream. Legacy events without
provenance remain nullable and are treated as `legacy_unknown`.

For MCP 2026-07-28 task and multi-round-trip responses, Python observations
also emit the bounded `result_type` discriminator (`complete`,
`input_required`, or `task`) and capped `input_request_count` /
`input_response_count` values when the response exposes them. The SDK never
stores task handles, request values, response content, or private reasoning.
This is evidence for analytics, not a claim that the Python middleware
implements the full Tasks wire lifecycle.

For `completion/complete`, the middleware records only bounded completion
friction metadata: returned value count (capped at 32), optional total
(capped at 1,000,000), and the `hasMore` flag. Suggestion values, arguments,
and completion content are never queued; analytics uses these fields only to
distinguish empty and partial responses.

For `elicitation/create`, the middleware retains only the explicit decision
`accept`, `decline`, or `cancel`. Questions, schemas, submitted values, and
returned content are never queued; an `accept` is not a business-approval
claim.

Catalog and protocol responses may also expose one-day-bounded
`cache_ttl_ms` and `cache_scope` (`public`/`private`) hints. These are
freshness/sharing metadata only; they do not grant authorization or promise
cache invalidation.

```python
import os
from mcp.server.fastmcp import FastMCP
from trackmcp import with_trackmcp

server = FastMCP("my-mcp-server")
app = with_trackmcp(server, api_key=os.environ["TRACKMCP_KEY"], service="my-mcp-server")
```

Telemetry is batched, redacted locally, and fail-open. Payload mode defaults to `redacted`; every default payload is recursively sanitized before it enters the queue or an HTTP body. Common sensitive keys, emails, bearer/basic tokens, JWTs, private-key text, credential-like text, binary/base64 resources, and credential-bearing URLs are replaced or omitted, and payloads are bounded to 32 KiB, depth 6, 50 keys/items per container, and 2,048 characters per string. Use `metadata` to omit arguments/results, or opt into `full` knowing it remains bounded and sanitized. The ingest route independently caps payloads at 128 KiB and requests at 1 MiB as a last-line defense for non-SDK clients.

If a transport disconnects or the server process exits outside an MCP request, call `client.record_transport_failure("transport_closed")` or `client.record_transport_failure("transport_error")`. The helper emits one bounded, metadata-only session observation; it never accepts or records exception text, headers, URLs, or payloads. It is optional and remains fail-open.

After the host successfully re-establishes its connection, it may call
`client.record_session_reconnected(transport="streamable_http")`. This is
caller-observed lifecycle evidence only: it does not claim replay, durable
delivery, or SDK ownership of reconnects, and it records only bounded session
metadata.

`redact` keeps compatibility with explicit dotted paths, while `redact_keys` adds case-insensitive exact key names. `redact_event` receives an already sanitized event, may mutate it, or can return `None` to drop it. Hook failures drop only the event. The SDK queue is bounded to 500 events or 2 MiB; failed deliveries are requeued within those limits.

For an explicit business outcome, optionally call `app.trackmcp.workflow("issue_resolution", "completed")` from your application code. This is an application-emitted signal, not proof that an answer was correct. Payloads default to bounded redacted mode; use `payload_mode="metadata"` to omit arguments/results. See the [Python docs](https://trackmcp.com/docs/python), [configuration reference](https://trackmcp.com/docs/reference), and [API docs](https://trackmcp.com/docs/api) for trace and latency semantics.

Intent and capability gaps are explicit, bounded signals. A safe `context` value is
captured as `intent_source="context_parameter"`; an `intent_fallback` callback is
labeled `fallback` when it supplies a value. Applications that call `capture` with
`intent_source="external_callback"` must supply the context themselves. Values
containing credentials, URLs, emails, or oversized text are omitted and become
`missing`. Report a missing tool or capability with:

```python
app.trackmcp.report_missing("bulk_export", "Export all matching records")
# or: from trackmcp import trackmcp_report_missing
trackmcp_report_missing("bulk_export")
```

The report is a bounded `custom` event named `trackmcp_report_missing` and retains
correlation provenance. The current Python MCP middleware does not rewrite tool
schemas; it leaves handler arguments unchanged. TrackMCP never infers intent from
private model reasoning, prompts, completions, or unsuccessful calls.
