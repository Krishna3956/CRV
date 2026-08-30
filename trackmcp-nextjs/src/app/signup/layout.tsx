import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create your TrackMCP account",
  description: "Create your TrackMCP account and start observing your MCP server.",
  robots: { index: false, follow: false },
};

export default function SignupLayout({ children }: LayoutProps<"/signup">) {
  return children;
}
