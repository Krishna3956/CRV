import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { DocsShell, DocTitle, DocLead, DocSection, Para, Code, Inline } from "@/components/DocsShell";

export const metadata: Metadata = pageMeta({
  title: "Go SDK | TrackMCP Docs",
  description: "Instrument a Go MCP server with bounded, fail-open TrackMCP telemetry.",
  path: "/docs/go",
});

export default function GoDocsPage() {
  return <DocsShell active="/docs/go">
    <DocTitle eyebrow="SDKs">Go SDK</DocTitle>
    <DocLead>The Go package provides transport-neutral, fail-open telemetry primitives for MCP servers. Capture at the server or transport boundary and flush during graceful shutdown.</DocLead>
    <DocSection title="Install">
      <Para>The Go SDK is currently a reviewed source package in this repository; it is not advertised as a separately published registry release yet. Add the package from your pinned repository checkout and keep <Inline>TRACKMCP_KEY</Inline> in your process environment.</Para>
      <Code>{`// From your pinned TrackMCP checkout:\ngo mod edit -replace github.com/trackmcp/trackmcp-go=../../trackmcp-nextjs/packages/go-sdk\ngo mod tidy`}</Code>
    </DocSection>
    <DocSection title="Capture and flush">
      <Code>{`client := trackmcp.New(trackmcp.Options{
    APIKey: os.Getenv("TRACKMCP_KEY"),
    Service: "acme-mcp-server",
    Environment: "production",
    ServerVersion: "2026.10.26", // bounded release metadata (optional)
    SDKVersion: "0.1.18",        // bounded release metadata (optional)
    DeploymentID: "deploy-42",   // bounded release metadata (optional)
})
defer client.Flush()

// At your MCP middleware or transport boundary:
client.Capture(trackmcp.Event{
    EventType: "tool_call",
    ToolName: "lookup",
    Success: true,
})`}</Code>
      <Para>Telemetry is asynchronous and fail-open: delivery errors do not block the MCP request. Keep captures bounded and never put API keys, OAuth tokens, prompts, results, or raw customer identifiers in event fields.</Para>
      <Para>Release labels are metadata only; they do not identify a customer or assert deployment health.</Para>
      <Code>{`// When the server process or stream fails outside a request:
client.RecordTransportFailure("transport_closed", sessionID, durationMS)
// or: client.RecordTransportFailure("transport_error", sessionID, durationMS)`}</Code>
      <Para>The transport observer records only bounded session metadata. It never accepts exception text, URLs, headers, or payloads.</Para>
    </DocSection>
    <DocSection id="entity-reads" title="Resources and prompts">
      <Para>Record a decoded <Inline>resources/read</Inline> or <Inline>prompts/get</Inline> response with the privacy-safe helper. The SDK hashes the URI or prompt name locally and emits only a bounded content/message count and result state; arguments and returned content never leave the process.</Para>
      <Code>{`client.RecordEntityRead("resources", "resources/read", resourceURI, map[string]any{
    "contents": decodedContents,
}, sessionID)
client.RecordEntityRead("prompts", "prompts/get", promptName, map[string]any{
    "messages": decodedMessages,
    "resultType": "complete",
}, sessionID)`}</Code>
      <Para>Call this after the MCP response has been decoded at your middleware boundary. It does not fetch resources or prompts and does not expose their bodies in TrackMCP.</Para>
    </DocSection>
    <DocSection title="Coverage and limits">
      <Para>The Go package is a primitive rather than an automatic MCP transport wrapper. Your middleware supplies the protocol method, tool, transport, and outcome fields. Account identity must come from an already-validated application claim and is hashed before storage. TrackMCP does not implement OAuth or inspect bearer tokens.</Para>
    </DocSection>
    <DocSection id="account-identity" title="Optional account identity">
      <Para>Resolve a stable, non-secret tenant or account handle in your own authenticated middleware and pass only that bounded handle in the event. Do not send an email, access token, URL, prompt, result, or raw user identifier. If your middleware cannot verify identity, omit it; the dashboard will keep the activity in an unresolved bucket.</Para>
      <Code>{`client := trackmcp.New(trackmcp.Options{
    APIKey: os.Getenv("TRACKMCP_KEY"),
    AccountIDResolver: func() string {
        return verifiedTenantForRequest()
    },
})`}</Code>
      <Para><Inline>AccountIDResolver</Inline> must return an already-validated, non-secret handle. The SDK hashes it locally; resolver failures are fail-open and remain unresolved.</Para>
    </DocSection>
    <DocSection id="verify-first-event" title="Verify your first event">
      <Para>Set the key in the same process, make one real tool call, wait for a flush, then open Setup in the dashboard. A key being accepted is not evidence that an MCP event arrived.</Para>
    </DocSection>
  </DocsShell>;
}
