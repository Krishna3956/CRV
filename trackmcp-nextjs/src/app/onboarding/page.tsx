import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Dashboard | TrackMCP",
  description: "Manage your TrackMCP workspace and view MCP server analytics.",
  path: "/dashboard",
  index: false,
});

export default function OnboardingPage() {
  redirect("/dashboard");
}
