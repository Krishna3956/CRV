# trackmcp

Install the privacy release with `pip install trackmcp==0.1.1`.

Correlation is disabled by default and does not change MCP schemas. External mode accepts a synchronous resolver returning an already anonymized opaque handle from bounded request metadata. Invalid, oversized, credential-like, or resolver-failed values are recorded as missing. `correlation_mode="issued"` is exposed for contract parity but is not enabled by the current Python MCP middleware because it has no stable schema-rewrite-and-strip seam; it therefore records missing provenance until a compatible adapter exists. Resolvers must not return emails, tokens, URLs, raw user IDs, prompts, completions, or private reasoning.

Observe the MCP server boundary without capturing a host's private model turn.

Events emitted by this server SDK carry `observation_source="server"`. The
P1-04 Node client adapter is TypeScript-only; Python client transports are not
supported in that workstream. Legacy events without provenance remain nullable
and are treated as `legacy_unknown`.

```python
import os
from trackmcp import with_trackmcp

app = with_trackmcp(server, api_key=os.environ["TRACKMCP_KEY"], service="my-mcp-server")
```

Telemetry is batched, redacted locally, and fail-open. Payload mode defaults to `redacted`; every default payload is recursively sanitized before it enters the queue or an HTTP body. Common sensitive keys, emails, bearer/basic tokens, JWTs, private-key text, credential-like text, binary/base64 resources, and credential-bearing URLs are replaced or omitted, and payloads are bounded to 32 KiB, depth 6, 50 keys/items per container, and 2,048 characters per string. Use `metadata` to omit arguments/results, or opt into `full` knowing it remains bounded and sanitized. The ingest route independently caps payloads at 128 KiB and requests at 1 MiB as a last-line defense for non-SDK clients.

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
