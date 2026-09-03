import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Create your TrackMCP account",
  description: "Create your TrackMCP account and start observing your MCP server.",
  path: "/signup",
  index: false,
});

export default function SignupLayout({ children }: LayoutProps<"/signup">) {
  return children;
}
