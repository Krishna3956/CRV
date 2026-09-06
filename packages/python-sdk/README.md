# trackmcp

Observe the MCP server boundary without capturing a host's private model turn.

```python
import os
from trackmcp import with_trackmcp

app = with_trackmcp(server, api_key=os.environ["TRACKMCP_KEY"], service="my-mcp-server")
```

Telemetry is batched, redacted locally, and fail-open. Payload mode defaults to `redacted`; common sensitive keys are recursively replaced, binary/base64 resources are scrubbed, and payloads are bounded to 32 KiB, depth 6, 50 keys/items per container, and 2,048 characters per string. Use `metadata` to omit arguments/results, or opt into `full` knowing it remains bounded. The ingest route independently caps payloads at 128 KiB and requests at 1 MiB as a last-line defense for non-SDK clients.

`redact` keeps compatibility with explicit dotted paths, while `redact_keys` adds case-insensitive exact key names. `redact_event` receives an already sanitized event, may mutate it, or can return `None` to drop it. Hook failures drop only the event. The SDK queue is bounded to 500 events or 2 MiB; failed deliveries are requeued within those limits.

For an explicit business outcome, optionally call `app.trackmcp.workflow("issue_resolution", "completed")` from your application code. This is an application-emitted signal, not proof that an answer was correct. Payloads default to bounded redacted mode; use `payload_mode="metadata"` to omit arguments/results. See the [Python docs](https://trackmcp.com/docs/python), [configuration reference](https://trackmcp.com/docs/reference), and [API docs](https://trackmcp.com/docs/api) for trace and latency semantics.
