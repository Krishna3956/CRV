# TrackMCP dummy MCP server

This is a real MCP server using the official TypeScript MCP SDK and stdio transport. It is intentionally small so the TrackMCP SDK can be tested without an external MCP project.

From this directory:

```bash
npm install
npm start
```

For local telemetry, set `TRACKMCP_KEY` and optionally `TRACKMCP_ENDPOINT`. The `echo` tool includes a secret argument to demonstrate local redaction before events leave the process.
