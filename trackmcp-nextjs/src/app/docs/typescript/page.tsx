import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import {
  DocsShell,
  DocTitle,
  DocLead,
  DocSection,
  Para,
  Code,
  Inline,
} from "@/components/DocsShell";

export const metadata: Metadata = pageMeta({
  title: "TypeScript SDK | TrackMCP Docs",
  description:
    "Install @trackmcp/sdk and wrap your Node MCP server in one line to capture every tool call, session, and client.",
  path: "/docs/typescript",
});

export default function TypeScriptDocsPage() {
  return (
    <DocsShell active="/docs/typescript">
      <DocTitle eyebrow="SDKs">TypeScript SDK</DocTitle>
      <DocLead>
        <Inline>@trackmcp/sdk</Inline> wraps the official MCP server so every call,
        result, and client is captured automatically. Works with Node 18+ and any
        transport.
      </DocLead>

      <DocSection title="Install">
        <Code>{`npm i @trackmcp/sdk
# Create a key at https://app.trackmcp.com/dashboard
# or: pnpm add @trackmcp/sdk / yarn add @trackmcp/sdk`}</Code>
      </DocSection>

      <DocSection title="Optional Node MCP client adapter">
        <Para>
          The separate <Inline>@trackmcp/sdk/client-adapter</Inline> entry point is
          Node.js-only and requires <Inline>@modelcontextprotocol/sdk</Inline> exactly
          <Inline>1.30.0</Inline>. It rejects browser and Edge runtimes and must not be
          imported by frontend bundles. The caller is responsible for protecting the
          API key. It supports only <Inline>StdioClientTransport</Inline> and
          <Inline>StreamableHTTPClientTransport</Inline>.
        </Para>
        <Code>{`import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { TrackMCPClientAdapter } from "@trackmcp/sdk/client-adapter";

const adapter = new TrackMCPClientAdapter({
  apiKey: process.env.TRACKMCP_KEY!,
  service: "my-mcp-client",
  transport: "stdio", // or "streamable_http"
});
const transport = new StdioClientTransport({ command: "my-mcp-server" });
const client = new Client({ name: "my-host", version: "1.0.0" });
await client.connect(adapter.wrapTransport(transport));`}</Code>
        <Para>
          Capture is metadata-only. It records client-observed issued calls, matched
          transport responses, observable next calls, repeats, and lifecycle boundaries;
          it does not record tool arguments/results, prompts, completions, private
          reasoning, token costs, promise outcomes, timeouts, aborts, or hidden HTTP
          reconnect/authentication behavior. Client events are labeled with
          <Inline>observation_source: &quot;client&quot;</Inline> and do not inflate the
          server-only aggregate or Tool Quality metrics. Malformed, notification,
          unmatched, and duplicate messages produce diagnostics only, and capture stays
          fail-open.
        </Para>
      </DocSection>

      <DocSection title="Wrap your server">
        <Para>
          Pass your existing server into <Inline>withTrackMCP</Inline> with your API
          key. Nothing else in your code changes.
        </Para>
        <Code>{`import { withTrackMCP } from "@trackmcp/sdk";
import { server } from "./mcp";

export default withTrackMCP(server, {
  apiKey: process.env.TRACKMCP_KEY!,
  service: "acme-mcp-server",
  environment: process.env.NODE_ENV,
});`}</Code>
      </DocSection>

      <DocSection title="Options">
        <Para>
          Every option except <Inline>apiKey</Inline> is optional. See the full{" "}
          <a href="/docs/reference" className="font-medium text-brand-strong underline">
            configuration reference
          </a>{" "}
          for defaults.
        </Para>
        <Code>{`withTrackMCP(server, {
  apiKey: process.env.TRACKMCP_KEY!,
  service: "acme-mcp-server",   // shows up as the server name
  environment: "production",     // production | staging | ...
  sampleRate: 1.0,               // 0-1, fraction of calls captured
  payloadMode: "redacted",      // metadata | redacted | full (all are bounded)
  redact: ["args.password", "args.token"], // never leaves your process
  redactKeys: ["customer_id"],  // optional additional case-insensitive keys
  maxPayloadBytes: 32768,        // final serialized payload budget
  endpoint: "https://trackmcp.com/api/v1/ingest", // compatible ingest endpoint override
  intentFallback: ({ toolName }) => toolName ? "Complete the " + toolName + " operation" : undefined,
});`}</Code>
      </DocSection>

      <DocSection title="Redacting sensitive fields">
        <Para>
          Redaction runs in your process before anything is sent. The default{" "}
          <Inline>redacted</Inline> mode recursively removes common sensitive keys,
          scrubs binary/base64 resources, and bounds depth, breadth, strings, and bytes.
          Use <Inline>metadata</Inline> when arguments and results must not be captured;
          <Inline>full</Inline> is opt-in but remains bounded.
        </Para>
        <Code>{`redact: ["args.email", "args.apiKey", "result.rawResponse"]
redactKeys: ["customer_id"]
redactEvent: (event) => event // return null to drop this event

// Truncations use a marker such as:
// { __trackmcp_truncated: true, reason: "max_payload_bytes", original_type: "object" }`}</Code>
      </DocSection>

      <DocSection title="Failure and queue behavior">
        <Para>
          A hook exception drops only that event. Delivery failures are retried from a
          bounded queue of 500 events or 2 MiB; oldest queued events are dropped when
          those limits are reached. Telemetry is fail-open and never blocks tool execution.
        </Para>
      </DocSection>

      <DocSection title="Optional correlation">
        <Para>
          Correlation is off by default and does not mutate MCP schemas. External mode accepts a
          synchronous resolver for bounded request metadata and stores only a validated anonymized
          opaque handle. Issued mode is opt-in and works only at the TypeScript transport boundary
          for compatible object-shaped tool schemas; clients may ignore the field, in which case
          provenance remains missing.
        </Para>
        <Code>{`correlation: {
  mode: "external",
  resolve: ({ toolName, sessionId }) => toolName ? anonymizedJobHandle(toolName, sessionId) : undefined,
}

// Never return emails, tokens, URLs, raw user IDs, prompts,
// completions, or private reasoning.`}</Code>
      </DocSection>

      <DocSection title="Explicit workflow outcomes">
        <Para>
          A workflow event is an application-emitted signal, not an inference about
          whether an answer was correct. Emit it only where your application knows the
          user task started, completed, or failed.
        </Para>
        <Code>{`server.trackmcp.workflow("issue_resolution", "completed", {
  issue_type: "bug",
});`}</Code>
        <Para>
          Open the authenticated <a href="https://app.trackmcp.com/dashboard" className="font-medium text-brand-strong underline">dashboard trace explorer</a> to inspect ordered server-boundary events. See the <a href="/docs/api" className="font-medium text-brand-strong underline">API reference</a> for the bounded trace response.
        </Para>
      </DocSection>

      <DocSection title="Intent and missing capabilities">
        <Para>
          Intent is opt-in context, not an inference. Compatible object-shaped
          <Inline>tools/list</Inline> schemas receive an optional <Inline>context</Inline>
          field with a one-sentence description. TrackMCP strips that known field before
          the customer handler and labels it <Inline>context_parameter</Inline>.
          Clients that omit or ignore it can use <Inline>intentFallback</Inline>, whose
          value is labeled <Inline>fallback</Inline>. Values supplied by an external
          application can be submitted with <Inline>intent_source</Inline> set to
          <Inline>external_callback</Inline>. Unsafe or absent values are
          <Inline>missing</Inline>; no private reasoning is inspected.
        </Para>
        <Code>{`withTrackMCP(server, {
  apiKey: process.env.TRACKMCP_KEY!,
  intentFallback: ({ toolName }) => toolName ? "Find the requested record" : undefined,
});

server.trackmcp.reportMissing("bulk_export", "Export all matching records");`}</Code>
      </DocSection>

      <DocSection title="Custom events">
        <Para>
          Want to track something beyond tool calls? Emit a named event from anywhere.
        </Para>
        <Code>{`import { track } from "@trackmcp/sdk";

track("checkout_completed", { amount: 4900, plan: "pro" });`}</Code>
      </DocSection>
    </DocsShell>
  );
}
