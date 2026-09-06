import type { Metadata } from "next";
import { DashboardPageContent } from "@/app/dashboard/page";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Set up your TrackMCP workspace",
  description: "Set up your TrackMCP workspace and create your first MCP server analytics key.",
  path: "/dashboard/onboarding",
  index: false,
});

export default function DashboardOnboardingPage() {
  return <DashboardPageContent onboardingMode />;
}
