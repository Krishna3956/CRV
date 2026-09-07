import type { Metadata } from "next";
import { McpTesterPage } from "@/components/mcp-tester/McpTesterPage";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "MCP Server Tester — Test, Inspect, and Health Check MCP Servers",
  description: "Test, inspect, and health-check an MCP server from your browser with a bounded HTTPS Streamable HTTP probe.",
  path: "/tools/mcp-server-tester",
});

export default function McpServerTesterPage() {
  return <McpTesterPage />;
}
