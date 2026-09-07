# TrackMCP

TrackMCP observes what your MCP server sees: clients, tools, protocol events,
redacted payloads, latency, errors, and explicit workflow outcomes. It observes the
server boundary; it does not read a host's private model turn unless you add a
separate client-side integration.

## Quickstart

Install the SDK for the process hosting your MCP server, create a workspace key, and
wrap the existing server:

```ts
import { withTrackMCP } from "@trackmcp/sdk";

export default withTrackMCP(server, {
  apiKey: process.env.TRACKMCP_KEY!,
  service: "my-mcp-server",
  environment: "production",
});
```

The Python wrapper has the same server-boundary behavior. See the [TypeScript
docs](https://trackmcp.com/docs/typescript), [Python docs](https://trackmcp.com/docs/python),
[configuration reference](https://trackmcp.com/docs/reference), and [API
docs](https://trackmcp.com/docs/api).

## What is shipped

- Asynchronous, fail-open telemetry for TypeScript and Python MCP servers.
- Tool calls, results/errors, timing, retries, protocol/catalog metadata, and client
  name/version when the initialize exchange provides them.
- Bounded redacted payload capture by default. Metadata mode omits arguments/results;
  full mode is opt-in but remains bounded.
- Authenticated analytics and ordered server-boundary trace inspection.
- Observed p50/p95 latency using nearest-rank samples; `N/A` is shown when no duration
  samples exist.
- Explicit application-emitted workflow outcomes, kept separate from tool success.
- Disabled-by-default regression alert APIs using seven complete UTC baseline days,
  the latest complete UTC day, server-only metrics, durable incident state, and
  bounded signed webhook delivery. Hourly evaluation is invoked by the separate
  disabled-by-default AWS scheduler worker; the dashboard Alerts view is
  intentionally a later increment after the backend contract is reviewed.

Payloads are sanitized locally with recursive sensitive-key redaction, explicit path
compatibility, binary/base64/resource scrubbing, depth/breadth/string/byte limits,
and truncation markers. Alert evidence contains bounded aggregates only; it never
contains raw event payloads, secrets, private reasoning, prompts, or completions.
TrackMCP does not provide model/session replay, exports, gateways, or proxying for
arbitrary hosted servers.

## Development

```bash
npm install
npm run dev
```

The Next.js app is in this directory. SDK package READMEs and examples live under
`packages/`.
