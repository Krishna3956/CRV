import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Onboarding | TrackMCP",
  robots: { index: false, follow: false },
};

export default function OnboardingPage() {
  redirect("/dashboard/onboarding");
}
