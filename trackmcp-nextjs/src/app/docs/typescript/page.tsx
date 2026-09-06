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
