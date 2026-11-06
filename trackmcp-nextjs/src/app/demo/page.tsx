import type { Metadata } from "next";
import { redirect } from "next/navigation";
import DemoDashboard from "@/app/demo/DemoDashboard";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "TrackMCP product demo",
  description: "Explore the TrackMCP dashboard with example MCP server activity, outcomes, and evidence.",
  path: "/demo",
  index: false,
});

export default async function DemoPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { demo } = await searchParams;
  if (demo !== "true") redirect("/signup");

  return <DemoDashboard />;
}
