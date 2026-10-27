import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { DocsShell, DocTitle, DocLead, DocSection, Para, Code, Inline, DocsNextSteps } from "@/components/DocsShell";

export const metadata: Metadata = pageMeta({
  title: "CLI proxy | TrackMCP Docs",
  description: "Run a bounded local stdio MCP observer with the TrackMCP CLI.",
  path: "/docs/cli",
});

export default function CliDocsPage() {
  return <DocsShell active="/docs/cli">
    <DocTitle eyebrow="CLI">Bounded stdio proxy</DocTitle>
    <DocLead>
      Launch an existing local, line-delimited JSON-RPC MCP server through the TrackMCP
      CLI and observe protocol metadata without changing the server process.
    </DocLead>
    <DocsNextSteps nativeHref="/docs/reference" />

    <DocSection title="Install and run">
      <Para>
        The bounded proxy is available in the published <Inline>@trackmcp/cli@0.1.12</Inline>
        package. Keep the workspace key in the environment; the CLI never accepts API
        keys as command-line arguments.
      </Para>
      <Code>{`export TRACKMCP_KEY=tmcp_...
npx @trackmcp/cli proxy -- npx my-mcp-server`}</Code>
      <Para>
        The separator is required. Everything after <Inline>--</Inline> is the child
        command and its arguments. Use <Inline>--service</Inline>,
        <Inline>--environment</Inline>, and <Inline>--endpoint</Inline> to provide
        bounded metadata and the HTTPS ingest endpoint when those values are not
        supplied by your release defaults.
      </Para>
    </DocSection>

    <DocSection title="What it observes">
      <Para>
        The launcher forwards the child process&apos;s original bytes unchanged in both
        directions. It parses a copy of complete JSONL messages only to emit bounded
        metadata: direction, transport, a safe method label, and a one-way message
        hash. JSON-RPC parameters, results, IDs, headers, URLs, and error bodies are
        never sent as telemetry.
      </Para>
      <Para>
        Telemetry delivery is asynchronous and fail-open. If the TrackMCP endpoint is
        unavailable, the MCP process continues to receive its original input and
        produce its original output.
      </Para>
    </DocSection>

    <DocSection title="Security boundary">
      <Para>
        The launcher is a local stdio boundary, not a hosted proxy. It does not proxy
        arbitrary HTTP or SSE servers, issue or exchange OAuth tokens, inspect bearer
        credentials, replay messages, or provide durable reconnect semantics. For
        Streamable HTTP, SSE, OAuth, and application-level identity, use the native
        SDK or the documented integration boundary instead.
      </Para>
      <Para>
        The endpoint must use HTTPS. The child is started without a shell, so shell
        metacharacters in arguments are not interpreted by the launcher.
      </Para>
    </DocSection>

    <DocSection id="verify" title="Verify the integration">
      <Para>
        Start the proxy with a disposable development key, make one real MCP request,
        and then check the workspace activity view. A successful child process is not
        proof that telemetry arrived; the dashboard must show the corresponding
        metadata event. Revoke the development key after testing.
      </Para>
    </DocSection>
  </DocsShell>;
}
