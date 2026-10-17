import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { PageFrame } from "@/components/PageFrame";
import { RepoListing } from "@/components/repository/RepoListing";
import { getNewestTools } from "@/lib/repository/queries";

export const metadata: Metadata = pageMeta({
  title: "What's New, latest MCP servers | TrackMCP",
  description:
    "The newest Model Context Protocol servers and tools added to the TrackMCP directory. Discover fresh MCP servers from the community.",
  path: "/new",
});

// Keep the listing fresh without querying Supabase on every visit. Successful
// submissions also invalidate this page explicitly in the submit route, so a
// newly submitted tool appears on the next visit without waiting 60 seconds.
export const revalidate = 60;

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
