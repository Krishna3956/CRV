import type { Metadata } from "next";
import type { ReactNode } from "react";
import { pageMeta } from "@/lib/seo";

type SignupLayoutProps = { children: ReactNode };

export const metadata: Metadata = pageMeta({
  title: "Create your TrackMCP account",
  description: "Create your TrackMCP account and start observing your MCP server.",
  path: "/signup",
  index: false,
});

export default function SignupLayout({ children }: SignupLayoutProps) {
  return children;
}
