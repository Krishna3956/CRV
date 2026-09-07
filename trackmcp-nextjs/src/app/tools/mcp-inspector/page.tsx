import type { Metadata } from "next";
import { McpTesterPage } from "@/components/mcp-tester/McpTesterPage";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMeta({ title: "MCP Inspector | TrackMCP", description: "Inspect MCP server identity, protocol, capabilities, and read-only catalogs from a browser.", path: "/tools/mcp-server-tester" }),
  alternates: { canonical: "/tools/mcp-server-tester" },
};

export default function McpInspectorPage() {
  return <McpTesterPage mode="inspector" />;
}
