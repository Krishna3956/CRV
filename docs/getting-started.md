# TrackMCP: how the product works

TrackMCP is an analytics layer for an MCP server. It does not replace the server and it does not sit in the path of a tool call. The MCP server keeps doing its normal work; the SDK quietly observes calls and sends small telemetry events to TrackMCP.

## The user journey

1. From the MCP server project, run `npx @trackmcp/cli init` for the terminal-first setup.
2. The CLI installs `@trackmcp/sdk` when needed, reuses a valid local key, or opens the browser device-authorization flow when no key exists.
3. Sign in or sign up in the browser, select or create a workspace, and approve the CLI session. The CLI redeems and stores the key locally; it never prints the raw key.
4. Wrap the existing MCP server with `withTrackMCP(...)` and make one real tool call.
5. The server continues serving tools normally. The SDK batches telemetry in the background.
6. Return to `/dashboard` to see tool calls, sessions, clients, errors, and latency.

For remote or restricted terminals, use `npx @trackmcp/cli init --no-browser` and open the printed URL on another device. The manual dashboard setup remains available when a team cannot use the CLI.

## What an API key means

An API key is the server's identifier for a TrackMCP workspace. It is not a user password and it should only be stored in the MCP server's environment or secret manager.

TrackMCP shows the full key only when it is created. The database stores a one-way SHA-256 hash and a short display prefix, so a stolen database row cannot be used as the original key. If a key is exposed, revoke it in the dashboard and create a replacement.

## TypeScript setup

```bash
# Recommended: one-command setup (installs the SDK and provisions a key)
npx @trackmcp/cli init

# Manual package-only setup
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
