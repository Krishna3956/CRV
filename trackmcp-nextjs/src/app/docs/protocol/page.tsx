import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { DocsShell, DocTitle, DocLead, DocSection, Para, Code, Inline } from "@/components/DocsShell";

export const metadata: Metadata = pageMeta({
  title: "MCP protocol support | TrackMCP Docs",
  description: "TrackMCP MCP protocol and transport compatibility, including the 2026-07-28 revision and legacy clients.",
  path: "/docs/protocol",
});

export default function ProtocolDocsPage() {
  return <DocsShell active="/docs/protocol">
    <DocTitle eyebrow="Reference">MCP protocol support</DocTitle>
    <DocLead>TrackMCP records the protocol era and transport your server actually reports. It does not turn a legacy client into a modern client, and it does not infer unsupported protocol features from a single request.</DocLead>
    <DocSection title="Supported telemetry boundary">
      <Para>The ingest schema accepts bounded events for the current <Inline>2026-07-28</Inline> revision and earlier handshake-era clients. Events can carry the negotiated protocol version, MCP method, transport, client metadata, request state counts, task identifiers, result state, and explicit error information.</Para>
      <Code>{`POST /api/v1/ingest
Authorization: Bearer $TRACKMCP_KEY

{
  "events": [{
    "event_type": "tool_call",
    "protocol_version": "2026-07-28",
    "transport": "streamable_http",
    "mcp_method": "tools/call"
  }]
}`}</Code>
    </DocSection>
    <DocSection title="2026-07-28 and legacy behavior">
      <Para>The 2026-07-28 revision uses a stateless core, per-request metadata, and optional <Inline>server/discover</Inline>. Earlier clients may use the initialize handshake and transport sessions. TrackMCP keeps these observations separate; a client-observed lifecycle is never silently treated as server-side business completion.</Para>
      <Para>The MCP tester can issue a bounded 2026-07-28 discovery request and report the negotiated version. The published TypeScript SDK currently pins the official v1 SDK and therefore remains a legacy/2025-era wrapper; use the tester and the direct ingest contract for modern protocol verification until a v2 SDK adapter is released.</Para>
    </DocSection>
    <DocSection title="Transport matrix">
      <Para>Native server instrumentation is recommended for complete semantics. The Node client adapter supports the official <Inline>StdioClientTransport</Inline>, <Inline>StreamableHTTPClientTransport</Inline>, and <Inline>SSEClientTransport</Inline> classes from the pinned v1 SDK. OTLP/HTTP JSON is supported as an interoperability path. Protobuf/gRPC OTLP, arbitrary browser/Edge interception, and generic proxying are not supported in this release.</Para>
    </DocSection>
    <DocSection title="What is not inferred">
      <Para>TrackMCP does not infer a customer from clientInfo, does not parse customer OAuth bearer tokens, does not infer workflow completion from sessions, and does not classify a missing event as abandonment. Configure a resolver for already-verified tenant identity and emit explicit workflow/task outcomes when those semantics matter.</Para>
    </DocSection>
  </DocsShell>;
}
