import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { DocsShell, DocTitle, DocLead, DocSection, Para, Code, Inline, DocsNextSteps } from "@/components/DocsShell";

export const metadata: Metadata = pageMeta({
  title: "MCP protocol support | TrackMCP Docs",
  description: "TrackMCP MCP protocol and transport compatibility, including the 2026-07-28 revision and legacy clients.",
  path: "/docs/protocol",
});

export default function ProtocolDocsPage() {
  return <DocsShell active="/docs/protocol">
    <DocTitle eyebrow="Reference">MCP protocol support</DocTitle>
      <DocLead>TrackMCP records the protocol era and transport your server actually reports. It does not turn a legacy client into a modern client, and it does not infer unsupported protocol features from a single request.</DocLead>
    <DocsNextSteps nativeHref="/docs/typescript" />
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
      <Para>The MCP tester can issue a bounded 2026-07-28 discovery request and report the negotiated version. The published TypeScript SDK pins the official v1 transport classes, while its Node observer records bounded modern method families, cache hints, subscription signals, task metadata, and caller-driven reconnect evidence. Its modern client exposes bounded catalog pages for tools, resources, resource templates, and prompts without reading resource contents or expanding templates; its metadata-only <Inline>callTool</Inline> recognizes complete, input-required, and server-directed task results without returning tool content, <Inline>tasks/get</Inline> projects terminal result metadata without result content, and <Inline>completion/complete</Inline> returns only bounded suggestion counts and completion metadata without suggestion values. It can send explicitly caller-requested task updates and cooperative cancellations, and listen to bounded task-status and catalog/resource change streams. Opt-in reconnect wrappers for both stream types retry only bounded network or stream failures; they do not replay, persist, or claim durable delivery, so callers must re-read catalogs and poll task handles after reconnecting. Task-related requests advertise the <Inline>io.modelcontextprotocol/tasks</Inline> extension capability required by the 2026-07-28 Tasks extension. Task creation, notification subscriptions, and result payload retrieval remain outside the adapter as durable lifecycle ownership. This remains an observability adapter with bounded task control, not a claim that the SDK implements every modern client lifecycle or a complete v2 client.</Para>
    </DocSection>
    <DocSection title="Transport matrix">
      <Para>Native server instrumentation is recommended for complete semantics. The Node client adapter supports the official <Inline>StdioClientTransport</Inline>, <Inline>StreamableHTTPClientTransport</Inline>, and <Inline>SSEClientTransport</Inline> classes from the pinned v1 SDK. OTLP/HTTP JSON and protobuf are supported as bounded metadata-only interoperability paths. OTLP/gRPC, arbitrary browser/Edge interception, and generic proxying are not supported in this release.</Para>
    </DocSection>
      <DocSection title="Roots and logging">
        <Para>The analytics boundary recognizes <Inline>roots/list</Inline> and <Inline>logging/setLevel</Inline> as separate bounded protocol families when they are observed, or when a client explicitly advertises the corresponding capability. TrackMCP records counts and outcome metadata only; root paths, log messages, and arbitrary level payloads are never exposed. These families remain partial until runtime fixtures and authenticated production evidence exist.</Para>
      </DocSection>
    <DocSection title="What is not inferred">
      <Para>TrackMCP does not infer a customer from clientInfo, does not parse customer OAuth bearer tokens, does not infer workflow completion from sessions, and does not classify a missing event as abandonment. Configure a resolver for already-verified tenant identity and emit explicit workflow/task outcomes when those semantics matter.</Para>
    </DocSection>
  </DocsShell>;
}
