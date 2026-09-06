# @trackmcp/sdk

Observability for MCP servers. Wrap your existing server once; telemetry is batched and delivered asynchronously at the server boundary. It does not capture a host's private model turn.

```ts
import { withTrackMCP } from "@trackmcp/sdk";

export default withTrackMCP(server, {
  apiKey: process.env.TRACKMCP_KEY!,
  service: "my-mcp-server",
});
```

Capture is fail-open: a slow or unavailable TrackMCP endpoint never blocks a tool call. Payload mode defaults to `redacted`; common sensitive keys are recursively replaced, binary/base64 resources are scrubbed, and payloads are bounded to 32 KiB, depth 6, 50 keys/items per container, and 2,048 characters per string. Use `metadata` to omit arguments/results, or opt into `full` knowing it remains bounded. The ingest route independently caps payloads at 128 KiB and requests at 1 MiB as a last-line defense for non-SDK clients.

`redact` keeps compatibility with explicit dotted paths, while `redactKeys` adds case-insensitive exact key names. `redactEvent` receives an already sanitized event, may mutate it, or can return `null` to drop it. Hook failures drop only the event. The SDK queue is bounded to 500 events or 2 MiB; failed deliveries are requeued within those limits.

Correlation is disabled by default and never changes MCP schemas. To attach an already anonymized, opaque business handle, opt into external mode; the resolver receives only bounded request metadata and its return value is validated before capture. Issued mode is opt-in and compatibility-limited to the TypeScript transport wrapper: compatible object-shaped `tools/list` schemas receive an optional `__trackmcp_correlation_handle` property, which is stripped before the handler. Strict or unsupported schemas and clients that ignore the field remain missing. Session IDs and request IDs are never used as business handles. Resolvers must not return emails, tokens, URLs, raw user IDs, prompts, completions, or private reasoning.

For accurate business outcomes, optionally mark a workflow from your own application code:

```ts
server.trackmcp.workflow("issue_resolution", "completed", { issue_type: "bug" });
```

Workflow status is an application-emitted signal; a successful tool response does not
prove that the user's task or answer was correct. Use `payloadMode: "metadata"` to
omit arguments/results or keep the default bounded `"redacted"` mode. The dashboard
shows observed p50/p95 latency, authenticated ordered traces, and `N/A` when a tool
has no duration samples. Start with the [TypeScript docs](https://trackmcp.com/docs/typescript)
and [API reference](https://trackmcp.com/docs/api).
