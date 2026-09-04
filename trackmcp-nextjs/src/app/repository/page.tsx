import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { PageFrame } from "@/components/PageFrame";
import { BrowseClient } from "@/components/repository/BrowseClient";
import { getTopTools, getToolCount } from "@/lib/repository/queries";

export const metadata: Metadata = pageMeta({
  title: "MCP Server Directory and Repository | TrackMCP",
  description:
    "Discover and explore Model Context Protocol tools and servers. Browse the TrackMCP repository, then measure your own MCP server with TrackMCP.",
  path: "/repository",
});

export const revalidate = 3600;

export default async function RepositoryPage() {
  const [tools, count] = await Promise.all([getTopTools(300), getToolCount()]);
  return (
    <>
      <Nav />
      <main className="flex-1">
        <PageFrame>
          <BrowseClient initialTools={tools} totalCount={count} />
        </PageFrame>
      </main>
      <Footer />
    </>
  );
}
