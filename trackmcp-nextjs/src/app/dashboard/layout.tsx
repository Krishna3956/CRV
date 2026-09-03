import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | TrackMCP",
  description: "Manage your TrackMCP workspace and view MCP server analytics.",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return children;
}
