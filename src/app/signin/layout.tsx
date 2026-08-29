import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Sign in | TrackMCP",
  description: "Sign in to your TrackMCP account.",
  path: "/signin",
  index: false,
});

export default function SignInLayout({ children }: LayoutProps<"/signin">) {
  return children;
}
