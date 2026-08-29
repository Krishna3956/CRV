import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { withTrackMCP } from "@trackmcp/sdk";

const server = withTrackMCP(
  new McpServer({ name: "trackmcp-dummy-server", version: "0.1.0" }),
  {
    apiKey: process.env.TRACKMCP_KEY || "tmcp_local_test",
    endpoint: process.env.TRACKMCP_ENDPOINT || "http://localhost:3000/api/v1/ingest",
    service: "trackmcp-dummy-server",
    environment: process.env.NODE_ENV || "development",
    redact: ["args.secret"],
    flushIntervalMs: Number(process.env.TRACKMCP_FLUSH_INTERVAL_MS || 5000),
  },
);

server.registerTool(
  "echo",
  {
    description: "Return the supplied message.",
    inputSchema: { message: z.string(), secret: z.string().optional() },
  },
  async ({ message }) => ({ content: [{ type: "text", text: message }] }),
);

server.registerTool(
  "health",
  { description: "Return the dummy server health." },
  async () => ({ content: [{ type: "text", text: "ok" }] }),
);

const transport = new StdioServerTransport();
await server.connect(transport);

process.on("SIGTERM", async () => {
  await server.trackmcp.flush();
  process.exit(0);
});
