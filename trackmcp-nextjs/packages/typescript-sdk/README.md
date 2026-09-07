# @trackmcp/sdk

Observability for MCP servers. Wrap your existing server once; telemetry is batched and delivered asynchronously at the server boundary. It does not capture a host's private model turn.

Install the privacy release with `npm install @trackmcp/sdk@0.1.1`. The package
is ESM-first, supports Node.js 18 and newer, and exposes the optional Node-only
client adapter through `@trackmcp/sdk/client-adapter`.

```ts
import { withTrackMCP } from "@trackmcp/sdk";

export default withTrackMCP(server, {
  apiKey: process.env.TRACKMCP_KEY!,
  service: "my-mcp-server",
});
```

Capture is fail-open: a slow or unavailable TrackMCP endpoint never blocks a tool call. Payload mode defaults to `redacted`; every default payload is recursively sanitized in the local process before it can enter the queue or an HTTP body. Common sensitive keys, emails, bearer/basic tokens, JWTs, credential-like text, binary/base64 resources, and credential-bearing URLs are replaced or omitted, and payloads are bounded to 32 KiB, depth 6, 50 keys/items per container, and 2,048 characters per string. Use `metadata` to omit arguments/results entirely, or opt into `full` knowing it remains bounded and still sanitized. The ingest route independently caps payloads at 128 KiB and requests at 1 MiB as a last-line defense for non-SDK clients.

## Node MCP client adapter

The optional `@trackmcp/sdk/client-adapter` entry point requires Node.js and
`@modelcontextprotocol/sdk` exactly `1.30.0`. It is not for browsers, Edge
runtime routes, frontend bundles, Python clients, SSE, or custom transports. The
caller is responsible for protecting the API key. Wrap one supported transport
before connecting the MCP client:

```ts
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { TrackMCPClientAdapter } from "@trackmcp/sdk/client-adapter";

const adapter = new TrackMCPClientAdapter({
  apiKey: process.env.TRACKMCP_KEY!,
  service: "my-mcp-client",
  transport: "stdio", // or "streamable_http"
});
const transport = new StdioClientTransport({ command: "my-mcp-server" });
const client = new Client({ name: "my-host", version: "1.0.0" });
await client.connect(adapter.wrapTransport(transport));
```

Client capture is metadata-only: it records transport-observed issued calls,
matched results, observable next calls, repeats, and lifecycle boundaries. It
does not capture tool arguments/results, prompts, completions, reasoning, token
costs, timeout/abort/rejection attribution, or hidden HTTP reconnect/auth
semantics. Client events carry `observation_source: "client"`; server SDK
events carry `"server"`, and default aggregate/tool-quality metrics use server
observations only. Missing, malformed, notification, unmatched, and duplicate
messages are diagnostics-only. The adapter is fail-open and uses the existing
bounded SDK queue and delivery behavior.

`redact` keeps compatibility with explicit dotted paths, while `redactKeys` adds case-insensitive exact key names. `redactEvent` receives an already sanitized event, may mutate it, or can return `null` to drop it. Hook failures drop only the event. The SDK queue is bounded to 500 events or 2 MiB; failed deliveries are requeued within those limits.

Correlation is disabled by default and never changes MCP schemas. To attach an already anonymized, opaque business handle, opt into external mode; the resolver receives only bounded request metadata and its return value is validated before capture. Issued mode is opt-in and compatibility-limited to the TypeScript transport wrapper: compatible object-shaped `tools/list` schemas receive an optional `__trackmcp_correlation_handle` property, which is stripped before the handler. Strict or unsupported schemas and clients that ignore the field remain missing. Session IDs and request IDs are never used as business handles. Resolvers must not return emails, tokens, URLs, raw user IDs, prompts, completions, or private reasoning.

For accurate business outcomes, optionally mark a workflow from your own application code:

```ts
server.trackmcp.workflow("issue_resolution", "completed", { issue_type: "bug" });
```

Intent and capability gaps are explicit, bounded signals. Compatible TypeScript
transports advertise an optional `context` tool argument and remove it before the
customer handler runs. Captured context is labeled `context_parameter`; clients that
omit or ignore it can use `intentFallback`, labeled `fallback`. Use `capture` with
`intent_source: "external_callback"` only when your application supplied the text.
Values containing credentials, URLs, emails, or oversized text are omitted. Report a
missing capability with `server.trackmcp.reportMissing("bulk_export", context)`;
the event is named `trackmcp_report_missing` and retains the normal correlation
provenance fields.

```ts
export default withTrackMCP(server, {
  apiKey: process.env.TRACKMCP_KEY!,
  intentFallback: ({ toolName }) => toolName ? `Complete the ${toolName} operation` : undefined,
});

server.trackmcp.reportMissing("bulk_export", "Export all matching records");
```

Python exposes the same event fields and a `report_missing` method, but its current
middleware does not rewrite MCP tool schemas; Python applications may provide
`context` through the public capture/reporting APIs. `intent_source: "missing"` is
used whenever no safe explicit or fallback context is available. TrackMCP never
infers intent from private reasoning, prompts, or completions.

Workflow status is an application-emitted signal; a successful tool response does not
prove that the user's task or answer was correct. Use `payloadMode: "metadata"` to
omit arguments/results or keep the default bounded `"redacted"` mode. The dashboard
shows observed p50/p95 latency, authenticated ordered traces, and `N/A` when a tool
has no duration samples. Start with the [TypeScript docs](https://trackmcp.com/docs/typescript)
and [API reference](https://trackmcp.com/docs/api).
