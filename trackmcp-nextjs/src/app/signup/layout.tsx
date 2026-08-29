import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create your TrackMCP workspace",
  description: "Create your TrackMCP workspace and start measuring your MCP server.",
  robots: { index: false, follow: false },
};

export default function SignupLayout({ children }: LayoutProps<"/signup">) {
  return children;
}
