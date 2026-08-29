import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { PageFrame } from "@/components/PageFrame";
import { RepoListing } from "@/components/repository/RepoListing";
import { getTopTools } from "@/lib/repository/queries";

export const metadata: Metadata = pageMeta({
  title: "Popular MCP servers — top by GitHub stars | TrackMCP",
  description:
    "The most popular Model Context Protocol servers and tools, ranked by GitHub stars. Explore the top MCP servers in the TrackMCP directory.",
  path: "/top-mcp",
});

export const revalidate = 3600;

export default async function TopMcpPage() {
  const tools = await getTopTools(60);
  return (
    <>
      <Nav />
      <main className="flex-1">
        <PageFrame>
          <RepoListing
            eyebrow="MCP Repository"
            title="Popular MCP servers"
            subtitle="The most-starred MCP servers and tools in the directory, ranked by GitHub stars."
            tools={tools}
          />
        </PageFrame>
      </main>
      <Footer />
    </>
  );
}
