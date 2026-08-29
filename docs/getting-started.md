# TrackMCP: how the product works

TrackMCP is an analytics layer for an MCP server. It does not replace the server and it does not sit in the path of a tool call. The MCP server keeps doing its normal work; the SDK quietly observes calls and sends small telemetry events to TrackMCP.

## The user journey

1. A server owner opens `/signin` and enters their work email.
2. Supabase sends a one-time sign-in link. There is no password to remember.
3. The first visit to `/dashboard` creates a private TrackMCP workspace and an API key.
4. The owner copies the key into the server's environment as `TRACKMCP_KEY`.
5. They install one SDK and wrap the existing MCP server with `withTrackMCP(...)`.
6. The server continues serving tools normally. The SDK batches telemetry in the background.
7. The owner returns to `/dashboard` to see tool calls, sessions, clients, errors, and latency.

## What an API key means

An API key is the server's identifier for a TrackMCP workspace. It is not a user password and it should only be stored in the MCP server's environment or secret manager.

TrackMCP shows the full key only when it is created. The database stores a one-way SHA-256 hash and a short display prefix, so a stolen database row cannot be used as the original key. If a key is exposed, revoke it in the dashboard and create a replacement.

## TypeScript setup

```bash
npm install @trackmcp/sdk
```

```ts
import { withTrackMCP } from "@trackmcp/sdk";

const trackedServer = withTrackMCP(server, {
  apiKey: process.env.TRACKMCP_KEY!,
  service: "my-mcp-server",
  environment: "production",
  redact: ["args.password", "args.token"],
});
```

The wrapper works with the official MCP TypeScript server transport. It captures the client name, tool name, duration, success/error state, and redacted arguments/results.

## Python setup

```bash
pip install trackmcp
```

```python
import os
from trackmcp import with_trackmcp

tracked_server = with_trackmcp(
    server,
    api_key=os.environ["TRACKMCP_KEY"],
    service="my-mcp-server",
    redact=["args.password", "args.token"],
)
```

## What data is sent

The SDK sends event metadata: tool name, client name when available, session ID when available, start time, duration, success/error state, and the explicitly configured payload fields. Redaction happens before the network request. TrackMCP never needs the user's MCP credentials or the contents of unrelated application data.

## What happens when TrackMCP is unavailable

Telemetry is best-effort. Events are queued and retried, but an ingest outage never blocks or changes an MCP tool response. The server remains usable while analytics catches up.

## Setup required by the operator

The application owner must run the telemetry migration in Supabase once, enable Supabase email authentication, and add the site's local and production callback URL ending in `/auth/callback`. After that, end users can create their own workspace and keys from the dashboard without using a terminal.
