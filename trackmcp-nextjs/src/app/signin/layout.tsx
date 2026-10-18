import type { Metadata } from "next";
import type { ReactNode } from "react";
import { pageMeta } from "@/lib/seo";

type SignInLayoutProps = { children: ReactNode };

export const metadata: Metadata = pageMeta({
  title: "Sign in | TrackMCP",
  description: "Sign in to your TrackMCP account.",
  path: "/signin",
  index: false,
});

export default function SignInLayout({ children }: SignInLayoutProps) {
  return children;
}
