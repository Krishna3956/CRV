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
  redact: ["args.password", "args.token"], // never leaves your process
  endpoint: "https://trackmcp.com/api/v1/ingest", // self-hosted override
});`}</Code>
      </DocSection>

      <DocSection title="Redacting sensitive fields">
        <Para>
          Redaction runs in your process before anything is sent. Point{" "}
          <Inline>redact</Inline> at any argument or result path and TrackMCP stores a{" "}
          <Inline>[redacted]</Inline> placeholder instead of the value.
        </Para>
        <Code>{`redact: ["args.email", "args.apiKey", "result.rawResponse"]`}</Code>
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
