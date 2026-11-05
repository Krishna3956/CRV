import type { Metadata } from "next";
import DemoDashboard from "@/app/demo/DemoDashboard";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "TrackMCP product demo",
  description: "Explore the TrackMCP dashboard with example MCP server activity, outcomes, and evidence.",
  path: "/demo",
  index: false,
});

export default function DemoPage() {
  return <DemoDashboard />;
}
