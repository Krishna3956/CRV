import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { PageFrame } from "@/components/PageFrame";
import { RepoListing } from "@/components/repository/RepoListing";
import { getNewestTools } from "@/lib/repository/queries";

export const metadata: Metadata = pageMeta({
  title: "What's New — latest MCP servers | TrackMCP",
  description:
    "The newest Model Context Protocol servers and tools added to the TrackMCP directory. Discover fresh MCP servers from the community.",
  path: "/new",
});

export const revalidate = 3600;

export default async function NewPage() {
  const tools = await getNewestTools(60);
  return (
    <>
      <Nav />
      <main className="flex-1">
        <PageFrame>
          <RepoListing
            eyebrow="MCP Repository"
            title="What's new in MCP"
            subtitle="The latest servers and tools added to the directory, newest first."
            tools={tools}
          />
        </PageFrame>
      </main>
      <Footer />
    </>
  );
}
