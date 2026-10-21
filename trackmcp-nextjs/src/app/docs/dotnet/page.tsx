import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { DocsShell, DocTitle, DocLead, DocSection, Para, Code, Inline } from "@/components/DocsShell";

export const metadata: Metadata = pageMeta({
  title: ".NET SDK | TrackMCP Docs",
  description: "Instrument an ASP.NET or .NET MCP server with bounded, fail-open TrackMCP telemetry.",
  path: "/docs/dotnet",
});

export default function DotnetDocsPage() {
  return <DocsShell active="/docs/dotnet">
    <DocTitle eyebrow="SDKs">.NET SDK</DocTitle>
    <DocLead>The .NET package provides transport-neutral, fail-open telemetry primitives for ASP.NET and .NET MCP servers. Capture at your middleware boundary and flush during graceful shutdown.</DocLead>
    <DocSection title="Install">
      <Para>The .NET SDK is currently a reviewed source package in this repository; it is not advertised as a separately published NuGet release yet. Add a project reference from your pinned checkout and keep <Inline>TRACKMCP_KEY</Inline> in your server secret store.</Para>
      <Code>{`dotnet add reference ../../trackmcp-nextjs/packages/dotnet-sdk/TrackMcp.csproj`}</Code>
    </DocSection>
    <DocSection title="Capture and flush">
      <Code>{`using var telemetry = new TrackMcpClient(new TrackMcpOptions(
    Environment.GetEnvironmentVariable("TRACKMCP_KEY") ?? "",
    "acme-mcp-server",
    "production"));

// In the MCP middleware/transport boundary:
telemetry.Capture("tool_call", "tools/call", toolName: "lookup", success: true);
await telemetry.FlushAsync();`}</Code>
      <Para>Capture and delivery are fail-open. Keep fields bounded and do not send API keys, OAuth tokens, prompts, results, or raw customer identifiers.</Para>
    </DocSection>
    <DocSection title="Coverage and limits">
      <Para>The .NET package is a transport-neutral primitive, not an automatic MCP server wrapper. Your middleware supplies protocol and transport fields. Account identity comes only from an application-validated claim and is hashed before storage. TrackMCP does not implement OAuth or parse bearer tokens.</Para>
    </DocSection>
    <DocSection id="verify-first-event" title="Verify your first event">
      <Para>Configure the key, make one real MCP tool call, flush during shutdown or after a bounded batch, then use Setup to confirm the event. Key creation alone never counts as telemetry.</Para>
    </DocSection>
  </DocsShell>;
}
