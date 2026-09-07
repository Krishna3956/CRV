import type { Metadata } from "next";
import { McpTesterPage } from "@/components/mcp-tester/McpTesterPage";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMeta({ title: "MCP Health Check | TrackMCP", description: "Check MCP endpoint reachability, protocol negotiation, catalogs, latency, and browser compatibility.", path: "/tools/mcp-server-tester" }),
  alternates: { canonical: "/tools/mcp-server-tester" },
};

export default function McpHealthCheckPage() {
  return <McpTesterPage mode="health" />;
}
