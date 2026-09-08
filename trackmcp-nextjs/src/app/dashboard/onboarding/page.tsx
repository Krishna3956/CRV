import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { redirect } from "next/navigation";

export const metadata: Metadata = pageMeta({
  title: "Dashboard | TrackMCP",
  description: "Manage your TrackMCP workspace and view MCP server analytics.",
  path: "/dashboard",
  index: false,
});

export default function DashboardOnboardingPage() {
  redirect("/dashboard");
}
