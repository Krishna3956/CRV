# Founder OS OpenTelemetry interoperability

## Current release boundary

TrackMCP currently accepts its versioned event envelope at `/api/v1/ingest`. The
TypeScript and Python SDKs emit MCP-aware events directly and remain the
recommended integration for complete protocol semantics.

The repository now includes a structural OTel span mapper in
`src/lib/telemetry/otel.ts`. It converts an already-collected OTel span into a
metadata-only TrackMCP event. The mapper understands the OTel/MCP-compatible
attribute names for operation, tool, protocol version, transport, session,
request, and client metadata. It intentionally does not copy span messages,
exception bodies, trace IDs, arguments, results, or arbitrary attributes.

The hosted boundary now also exposes `POST /api/v1/otel/v1/traces` for bounded
OTLP/HTTP JSON. It accepts at most 256 KiB and 100 spans, requires the normal
TrackMCP bearer key, maps only the approved MCP metadata fields, and delegates
to the same authenticated ingest path as the SDK. The response includes
`accepted_spans` and `rejected_spans`, so spans outside the MCP mapping are
visible to exporters and operators rather than being mistaken for accepted
telemetry. It intentionally returns
`415` for protobuf because protobuf decoding is not enabled in this release;
customers using a protobuf exporter should configure JSON encoding or use the
local mapper/SDK path.

The endpoint is not a general-purpose span archive. Full attributes, trace IDs,
logs, exception bodies, and raw span events are not persisted. Unsupported or
malformed spans are omitted from the mapped event set and do not become false
successes.

## Supported mapping

| OTel signal | TrackMCP field | Notes |
| --- | --- | --- |
| `mcp.method.name`, `mcp.method`, `gen_ai.operation.name`, span name | `mcp_method` | Required operation selector |
| `gen_ai.tool.name`, `mcp.tool.name`, `tool.name` | `tool_name` | Makes `tools/call` a `tool_call` event |
| `mcp.protocol.version`, `gen_ai.protocol.version` | `protocol_version` | Bounded string |
| `mcp.transport`, `server.transport` | `transport` | Known transports are normalized |
| `mcp.session.id`, `gen_ai.conversation.id` | `session_id` | No arbitrary trace IDs are used as identity |
| `mcp.request.id`, `rpc.request.id` | `request_id` | Bounded correlation metadata |
| `mcp.client.name`, `gen_ai.agent.name` | `client_name` | ClientInfo remains observational, not verified identity |
| `mcp.client.version` | `client_version` | Bounded string |
| OTel status / `error.type` | `success`, `is_error` | Unknown status remains unknown |
| span start/end | `started_at`, `duration_ms` | Duration is bounded to seven days |

## Explicit gaps before calling OTel “complete”

- There is no hosted OTLP/gRPC receiver; the hosted JSON endpoint is the only
  supported OTLP transport in this release.
- There is no automatic OpenTelemetry SDK instrumentation package.
- There is no external OTel export destination configured by TrackMCP.
- Trace/span links are not persisted in the current TrackMCP schema.
- OTel resource attributes and baggage are not copied by default.
- Customers should verify the first accepted event after configuring the JSON
  endpoint. The mapper and hosted endpoint both preserve the same bounded
  metadata-only semantics.

These are product scope items, not hidden implementation details. The mapper
and its fixtures make the current boundary testable without overstating what
is production-ready.
