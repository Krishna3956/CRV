# trackmcp

```python
import os
from trackmcp import with_trackmcp

app = with_trackmcp(server, api_key=os.environ["TRACKMCP_KEY"], service="my-mcp-server")
```

Telemetry is batched, redacted locally, and fail-open.

For an explicit business outcome, optionally call `tracked_server.trackmcp.workflow("issue_resolution", "completed")` from your application code.
