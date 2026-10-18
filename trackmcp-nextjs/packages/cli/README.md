# @trackmcp/cli

The terminal-first setup companion for `@trackmcp/sdk`. It never runs from
`npm install`, `postinstall`, `prepare`, or any other package lifecycle hook.
Installing this package does not open a browser, create an account, send an
install ping, or request a TrackMCP password.

## Setup

From an interactive local terminal, run:

```bash
npx @trackmcp/cli init
```

The CLI prints a verification URL and short code before opening the browser.
Sign up or sign in, approve the workspace key, and the one-time key is written
to `.env.local` with restrictive permissions. The URL and code can be completed
on another device:

```bash
npx @trackmcp/cli init --no-browser
npx @trackmcp/cli init --browser=false
```

`setup` remains a backwards-compatible alias for `init`. The CLI polls only the
short-lived device session, honors server-directed intervals, and stops on
approval, denial, expiry, cancellation, or timeout. It never prints the key,
puts a secret in a URL or shell argument, or rewrites application source code.

If a usable `TRACKMCP_KEY` already exists in the process environment or the
selected environment file, `init` leaves it unchanged. Existing keys are never
overwritten without confirmation. If `.env.local` is tracked by Git, the CLI
warns so it can be ignored before committing.

For CI and other non-interactive environments, provision the key through the
environment or a secret manager:

```bash
TRACKMCP_KEY=tmcp_... npx @trackmcp/cli doctor --non-interactive
```

The CLI never accepts an API key as a positional argument. The manual fallback
is to create a connection key in the TrackMCP web app, set `TRACKMCP_KEY` in
the MCP server environment, install `@trackmcp/sdk`, and make one real tool
call.

## Doctor and logout

```bash
npx @trackmcp/cli doctor
npx @trackmcp/cli doctor --non-interactive
npx @trackmcp/cli logout
```

`doctor` checks Node.js, the SDK package and version, package manager,
environment-file discovery, key presence/format (without displaying the key),
ingest reachability, and the dedicated key-status endpoint. It distinguishes
missing or malformed keys, unauthorized/revoked/permission states, retryable
responses, network failures, no accepted telemetry, and accepted telemetry.
It does not send fake telemetry or execute MCP tools. `logout` removes only
local CLI session metadata; it does not delete environment keys.

## SDK integration

```ts
import { withTrackMCP } from "@trackmcp/sdk";

export default withTrackMCP(server, {
  apiKey: process.env.TRACKMCP_KEY,
  service: "my-mcp-server",
});
```

The SDK is fail-open: a missing or rejected key never blocks an MCP call. See
the SDK README for diagnostic categories and the manual signup path.
