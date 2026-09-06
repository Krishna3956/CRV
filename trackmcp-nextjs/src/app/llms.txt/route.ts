const LLMS_CONTENT = `# TrackMCP

> See how your MCP server is being used.

TrackMCP is analytics and observability for Model Context Protocol servers. It shows which clients connect, which tools agents use, where calls fail or slow down, and whether workflows complete. Instrument a TypeScript or Python server with one line, then use the dashboard to improve the server agents actually use.

TrackMCP also maintains a directory of MCP servers and tools so builders can discover projects, inspect documentation, compare categories, and follow what is new in the ecosystem.

## Product

- [MCP server analytics](https://trackmcp.com/mcp-server-analytics): Understand clients, connections, tool discovery, sessions, failures, latency, retries, and workflow outcomes.
- [MCP tool analytics](https://trackmcp.com/mcp-tool-analytics): Measure tool adoption, selection, errors, retries, latency, and completion.
- [MCP observability](https://trackmcp.com/mcp-observability): Observe the full path from client connection to tool call and workflow result.
- [Remote HTTP observability](https://trackmcp.com/mcp-observability/remote-http): Investigate transport, authorization, tool calls, latency, and failures for remote MCP servers.
- [Features](https://trackmcp.com/features): Explore event-level analytics, session views, alerts, webhooks, REST API access, and OpenTelemetry export.
- [Pricing](https://trackmcp.com/pricing): Review TrackMCP plans and early-access details.

## Directory

- [MCP server directory](https://trackmcp.com/repository): Browse servers and tools by what they do, inspect documentation, and see what the community is building.
- [Popular MCP servers](https://trackmcp.com/top-mcp): Browse leading servers ranked by GitHub stars.
- [New MCP servers](https://trackmcp.com/new): See recently added and recently updated projects.
- [MCP categories](https://trackmcp.com/categories): Browse AI and ML, developer kits, infrastructure, search, automation, and other categories.
- [Submit an MCP server](https://trackmcp.com/submit-mcp): Add a project to the TrackMCP directory.
- [All directory pages](https://trackmcp.com/tool-sitemap.xml): Machine-readable index of individual MCP server pages.

## Documentation

- [Documentation](https://trackmcp.com/docs): Start integrating TrackMCP with an MCP server.
- [MCP analytics quickstart](https://trackmcp.com/mcp-server-analytics/quickstart): Instrument a TypeScript or Python server and verify the first event.
- [TypeScript SDK](https://trackmcp.com/docs/typescript): TypeScript installation and integration guide.
- [Python SDK](https://trackmcp.com/docs/python): Python installation and integration guide.
- [REST API](https://trackmcp.com/docs/api): Query TrackMCP analytics programmatically.
- [Configuration reference](https://trackmcp.com/docs/reference): Configure SDK behavior, redaction, batching, and telemetry.

## Learn and company

- [Blog](https://trackmcp.com/blog): Production guides about MCP analytics, observability, security, and reliability.
- [About TrackMCP](https://trackmcp.com/about): Why TrackMCP exists and what the product focuses on.
- [Security](https://trackmcp.com/security): Telemetry minimization, redaction, workspace isolation, API keys, retention, and fail-open operation.
- [Privacy policy](https://trackmcp.com/privacy): Data handling and privacy information.
- [Terms of service](https://trackmcp.com/terms): Terms for using TrackMCP.
- [Contact](https://trackmcp.com/contact): Contact TrackMCP about sales, support, or documentation.
`;

export const revalidate = 3600;

export function GET() {
  return new Response(LLMS_CONTENT, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
