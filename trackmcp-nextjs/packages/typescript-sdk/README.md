# @trackmcp/sdk

Observability for MCP servers. Wrap your existing server once; telemetry is batched and delivered asynchronously.

```ts
import { withTrackMCP } from "@trackmcp/sdk";

export default withTrackMCP(server, {
  apiKey: process.env.TRACKMCP_KEY!,
  service: "my-mcp-server",
});
```

Capture is fail-open: a slow or unavailable TrackMCP endpoint never blocks a tool call. Payload mode defaults to `redacted`; common sensitive keys are recursively replaced, binary/base64 resources are scrubbed, and payloads are bounded to 32 KiB, depth 6, 50 keys/items per container, and 2,048 characters per string. Use `metadata` to omit arguments/results, or opt into `full` knowing it remains bounded. The ingest route independently caps payloads at 128 KiB and requests at 1 MiB as a last-line defense for non-SDK clients.

`redact` keeps compatibility with explicit dotted paths, while `redactKeys` adds case-insensitive exact key names. `redactEvent` receives an already sanitized event, may mutate it, or can return `null` to drop it. Hook failures drop only the event. The SDK queue is bounded to 500 events or 2 MiB; failed deliveries are requeued within those limits.

For accurate business outcomes, optionally mark a workflow from your own application code:

```ts
server.trackmcp.workflow("issue_resolution", "completed", { issue_type: "bug" });
```
