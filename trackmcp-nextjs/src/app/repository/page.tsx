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

// Keep the initial directory snapshot reasonably fresh. On successful
// submission, the submit route also invalidates this page explicitly.
export const revalidate = 60;

export default async function RepositoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const [tools, count, trendingTools] = await Promise.all([
    getTopTools(300),
    getToolCount(),
    getTopTools(5),
  ]);
  const params = await searchParams;
  const initialQuery = typeof params.q === "string" ? params.q : "";
  return (
    <>
      <Nav />
      <main className="flex-1">
        <PageFrame>
          <BrowseClient
            initialTools={tools}
            totalCount={count}
            initialQuery={initialQuery}
            trendingToolIds={trendingTools.map((tool) => tool.id)}
            // Category totals are loaded lazily after the user chooses a
            // category so the directory itself is not blocked by a full
            // catalog scan on first navigation.
            categoryCounts={{}}
          />
        </PageFrame>
      </main>
      <Footer />
    </>
  );
}
