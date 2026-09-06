import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Onboarding | TrackMCP",
  description: "Complete TrackMCP onboarding to start observing your MCP server.",
  path: "/onboarding",
  index: false,
});

export default function OnboardingPage() {
  redirect("/dashboard/onboarding");
}
