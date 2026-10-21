# TrackMCP .NET SDK

Transport-neutral, fail-open telemetry primitives for ASP.NET and .NET MCP servers. Use `Capture` at the MCP middleware boundary and flush during graceful shutdown.

The .NET SDK is currently a reviewed source package, not a published NuGet
release. Keep `TRACKMCP_KEY` in your server secret store and use the pinned
project reference documented at `/docs/dotnet`. Capture only bounded,
privacy-safe metadata: never send API keys, OAuth tokens, prompts, results,
URLs, or raw customer identifiers. Account identity must come from an
application-validated claim and is hashed before persistence. TrackMCP does not
implement OAuth or parse bearer tokens. Capture and delivery are fail-open so
telemetry failures do not block MCP requests.

After configuring the key, make one real MCP tool call, flush during shutdown
or after a bounded batch, and confirm the event in Setup. Key creation alone
never counts as telemetry.
