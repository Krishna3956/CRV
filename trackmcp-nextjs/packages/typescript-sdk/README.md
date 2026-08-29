# @trackmcp/sdk

Observability for MCP servers. Wrap your existing server once; telemetry is batched and delivered asynchronously.

```ts
import { withTrackMCP } from "@trackmcp/sdk";

export default withTrackMCP(server, {
  apiKey: process.env.TRACKMCP_KEY!,
  service: "my-mcp-server",
});
```

Capture is fail-open: a slow or unavailable TrackMCP endpoint never blocks a tool call. Use `redact` to remove sensitive argument/result paths before transmission.

For accurate business outcomes, optionally mark a workflow from your own application code:

```ts
server.trackmcp.workflow("issue_resolution", "completed", { issue_type: "bug" });
```
