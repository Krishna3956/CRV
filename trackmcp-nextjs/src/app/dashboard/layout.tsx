import type { Metadata } from "next";
import type { ReactNode } from "react";
import { pageMeta } from "@/lib/seo";

type DashboardLayoutProps = { children: ReactNode };

export const metadata: Metadata = pageMeta({
  title: "Dashboard | TrackMCP",
  description: "Manage your TrackMCP workspace and view MCP server analytics.",
  path: "/dashboard",
  index: false,
});

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return children;
}
