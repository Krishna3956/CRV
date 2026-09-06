# trackmcp

```python
import os
from trackmcp import with_trackmcp

app = with_trackmcp(server, api_key=os.environ["TRACKMCP_KEY"], service="my-mcp-server")
```

Telemetry is batched, redacted locally, and fail-open. Payload mode defaults to `redacted`; common sensitive keys are recursively replaced, binary/base64 resources are scrubbed, and payloads are bounded to 32 KiB, depth 6, 50 keys/items per container, and 2,048 characters per string. Use `metadata` to omit arguments/results, or opt into `full` knowing it remains bounded.

`redact` keeps compatibility with explicit dotted paths, while `redact_keys` adds case-insensitive exact key names. `redact_event` receives an already sanitized event, may mutate it, or can return `None` to drop it. Hook failures drop only the event. The SDK queue is bounded to 500 events or 2 MiB; failed deliveries are requeued within those limits.

For an explicit business outcome, optionally call `tracked_server.trackmcp.workflow("issue_resolution", "completed")` from your application code.
