# @trackmcp/sdk

Observability for MCP servers. Wrap your existing server once; telemetry is batched and delivered asynchronously at the server boundary. It does not capture a host's private model turn.

Install the current published package with `npm install @trackmcp/sdk`. Pin an
exact version in your application lockfile when you need reproducible builds.
The package is ESM-first, supports Node.js 18 and newer, and exposes the optional Node-only
client adapter through `@trackmcp/sdk/client-adapter`.

```ts
import { withTrackMCP } from "@trackmcp/sdk";

export default withTrackMCP(server, {
  apiKey: process.env.TRACKMCP_KEY!,
  service: "my-mcp-server",
  server_version: "2026.10.26", // bounded release metadata (optional)
  sdk_version: "0.1.20",        // bounded release metadata (optional)
  deployment_id: "deploy-42",   // bounded release metadata (optional)
});
```

Release labels are metadata only; they do not identify a customer or assert
deployment health.

Capture is fail-open: a slow or unavailable TrackMCP endpoint never blocks a tool call. Payload mode defaults to `redacted`; every default payload is recursively sanitized in the local process before it can enter the queue or an HTTP body. Common sensitive keys, emails, bearer/basic tokens, JWTs, credential-like text, binary/base64 resources, and credential-bearing URLs are replaced or omitted, and payloads are bounded to 32 KiB, depth 6, 50 keys/items per container, and 2,048 characters per string. Use `metadata` to omit arguments/results entirely, or opt into `full` knowing it remains bounded and still sanitized. The ingest route independently caps payloads at 128 KiB and requests at 1 MiB as a last-line defense for non-SDK clients.

## Node MCP client adapter

The optional `@trackmcp/sdk/client-adapter` entry point requires Node.js and
`@modelcontextprotocol/sdk` exactly `1.32.2`. It is not for browsers, Edge
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
  transport: "stdio", // or "streamable_http" or "sse"
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

## Modern MCP discovery client

The `@trackmcp/sdk/modern-client` entry point provides a bounded stateless
`server/discover` request for the `2026-07-28` MCP revision. It sends the
required protocol headers, rejects credential-bearing endpoints, bounds the
response to 256 KiB, and returns only sanitized protocol versions, server
identity, and capability names:

```ts
import { ModernMcpClient } from "@trackmcp/sdk/modern-client";

const discovery = await new ModernMcpClient({ endpoint: process.env.MCP_ENDPOINT! }).discover();
```

`capabilityNames` contains the bounded top-level capability names and any
advertised extension names (for example,
`io.modelcontextprotocol/tasks`). After discovery, the client fails closed
before sending a request when a catalog, task lifecycle method, or catalog subscription
method is not advertised by the peer. Tool calls and completions also fail
closed when `tools` or `completions` is absent. Callers that skip discovery keep
the compatibility behavior of the bounded request methods.

Every modern request also carries a bounded
`io.modelcontextprotocol/clientInfo` object in per-request `_meta`, as required
by the stateless 2026-07-28 revision. The default identity is
`@trackmcp/sdk@0.1.20`; callers may provide a safe `{ name, version }` pair via
`ModernMcpClient` options. Invalid or control-character values fall back to
the SDK identity, and no credentials or payload data are included.

For a bounded catalog page, use `tools/list` with an opaque cursor. Tool names,
descriptions, schemas, and cursors are size-limited and sanitized before they
are returned; the method does not execute tools or retain arguments/results:

```ts
const page = await new ModernMcpClient({ endpoint: process.env.MCP_ENDPOINT! }).listTools();
for (const tool of page.tools) console.log(tool.name);
```

The same bounded catalog surface exposes `resources/list`,
`resources/templates/list`, and `prompts/list`: `listResources` returns
sanitized resource metadata without reading resource contents,
`listResourceTemplates` returns URI-template metadata without expanding or
dereferencing templates, and `listPrompts` returns prompt names and argument
names without requesting or retaining argument values. All three methods
support opaque cursors and remain observation-only.
When a peer supplies `ttlMs`/`ttl_ms` or `cacheScope`/`cache_scope`, each page
also exposes bounded `cacheHints` (`ttlMs` is clamped to one day and scope
is limited to `public`/`private`). These are server-provided freshness/sharing
hints only; the adapter does not treat them as authorization, cache
invalidation, or durable snapshot guarantees.

The modern `subscriptions/listen` adapter projects the same bounded
`cacheHints` from an acknowledgement or response envelope when the peer
supplies them. It does not implement cache invalidation or replay ownership.

For privacy-safe entity reads, `readResource(uri)` and `getPrompt(name,
arguments)` send the caller-selected request but return only a SHA-256 identity
hash, bounded content/message count, and an optional error bit. Resource bodies,
prompt messages, and argument values are never returned or retained by this
adapter.

Completion requests are also bounded and metadata-only. `complete` sends the
caller-selected prompt or resource reference and argument to
`completion/complete`, then returns only the number of suggestions and the
server's bounded `total`/`hasMore` metadata; suggestion values are never
returned by this adapter:

```ts
const completion = await client.complete(
  { type: "ref/prompt", name: "summarize" },
  { name: "format", value: "mar" },
);
```

The modern client accepts both JSON and bounded Streamable HTTP
`text/event-stream` responses. SSE notifications are ignored until the
matching result is received; a response ID, when present, must match the
request. The stream is still observation-only and is not a general-purpose
subscription or proxy implementation.

For bounded historical discovery, `listAllTools`, `listAllResources`, and
`listAllPrompts` follow opaque cursors up to a fixed page/item budget and return
`truncated: true` when the server continues beyond that budget or repeats a
cursor. A `false` value means the bounded traversal reached an explicit end;
it is not a claim that an unbounded catalog exists outside the adapter budget.

Task state can be observed when the server returns an opaque task handle as
part of a supported request. `getTask` reads one bounded status. For servers
that surface `inputRequests`, `updateTask` sends bounded `inputResponses`; the
caller must validate user input and must not place secrets in it. `cancelTask`
sends the cooperative cancellation signal and does not claim that the server
has already reached `cancelled`:

```ts
const status = await client.getTask(taskIdFromYourServerResponse);
await client.updateTask(taskIdFromYourServerResponse, {
  name: { action: "accept", content: { input: "Luca" } },
});
await client.cancelTask(taskIdFromYourServerResponse);
const settled = await client.waitForTask(taskIdFromYourServerResponse, {
  maxPolls: 12,
  maxWaitMs: 30_000,
});
```

The modern Tasks extension does not define `tasks/list`; the compatibility
shaped `listTasks()` method therefore fails closed without sending a request.
The observer never creates or subscribes to tasks. Task input is sent only
when the caller explicitly invokes `updateTask`; request bodies are bounded
and task IDs are sent in the required `Mcp-Name` routing header. Task status is
diagnostic evidence; callers own authorization, user consent, and lifecycle
policy and should treat missing or malformed state as unknown.

`waitForTask` is a bounded polling convenience: it respects the server's
`pollIntervalMs`, stops only on an explicit terminal status, and returns
`timedOut: true` when its poll or time budget ends. It never returns task
result or input payloads; it retains only allowlisted status, lifecycle
timestamps, status message, polling, TTL, and input-request key metadata. Use
the server's own authorized task client for task contents.

This is intentionally a bounded discovery/catalog/status surface, not a claim
of complete modern client lifecycle support. Tool execution and task creation
remain outside the adapter. `listenForTaskUpdates` supports a bounded
Streamable HTTP `subscriptions/listen` request for task IDs and emits
sanitized task metadata through an optional callback; it stops at fixed
event/byte/time bounds and reports truncation. It is not a durable
subscription or reconnect manager, and it does not expose task result or input
payloads. Task-related requests advertise the `io.modelcontextprotocol/tasks`
client extension required by the 2026-07-28 Tasks specification. Task update
and cooperative cancellation remain explicit caller-controlled methods. When a
peer supplies them, bounded one-day `cacheHints` from task-stream
acknowledgements are exposed as metadata only.

`listenForUpdates` also supports bounded 2026-07-28 catalog/resource change
notifications (`toolsListChanged`, `promptsListChanged`,
`resourcesListChanged`, and `resourceSubscriptions`). It returns only event
kinds, one-way SHA-256 resource URI hashes, and the server's honored filter;
the stream has the same fixed event/byte/time bounds and is not a durable
reconnect manager.

For `elicitation/create`, the Node observer retains only an explicit
`protocol_decision` of `accept`, `decline`, or `cancel`. It never captures the
question, requested schema, submitted values, or returned content. An
`accept` is a protocol action, not proof of business approval.

`callTool` sends a bounded tool request with the Tasks extension capability and
returns only result metadata (`complete`, `input_required`, or server-directed
`task`). Tool content, arguments, errors, and task result payloads are not
returned or retained; callers use the explicit task methods for subsequent
status and input-response control.

`redact` keeps compatibility with explicit dotted paths, while `redactKeys` adds case-insensitive exact key names. `redactEvent` receives an already sanitized event, may mutate it, or can return `null` to drop it. Hook failures drop only the event. The SDK queue is bounded to 500 events or 2 MiB; failed deliveries are requeued within those limits.

Correlation is disabled by default and never changes MCP schemas. To attach an already anonymized, opaque business handle, opt into external mode; the resolver receives only bounded request metadata and its return value is validated before capture. Issued mode is opt-in and compatibility-limited to the TypeScript transport wrapper: compatible object-shaped `tools/list` schemas receive an optional `__trackmcp_correlation_handle` property, which is stripped before the handler. Strict or unsupported schemas and clients that ignore the field remain missing. Session IDs and request IDs are never used as business handles. Resolvers must not return emails, tokens, URLs, raw user IDs, prompts, completions, or private reasoning.

For verified organization/account reporting, provide `accountIdResolver`. It must read an account or tenant claim that your application has already authenticated; TrackMCP does not parse bearer tokens or treat MCP `clientInfo` as identity. The bounded resolver result is hashed locally into `account_key` and labeled `account_identity_source: "resolver"`. Resolver errors, unsafe values, or an omitted resolver remain `unresolved` and never affect the MCP request.

For accurate business outcomes, optionally mark a workflow from your own application code:

```ts
server.trackmcp.workflow("issue_resolution", "completed", { issue_type: "bug" });
```

Protocol notifications can be recorded without values through
`server.trackmcp.recordProtocolSignal(signal, method, sessionId)`. Signals are
limited to `progress`, `cancelled`, `catalog_changed`, `resource_changed`,
`prompt_changed`, `subscription_started`, and `subscription_stopped`; progress
values, cancellation reasons, subscription identifiers, URIs, and payloads
are not accepted.

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
