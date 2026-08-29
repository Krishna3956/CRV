import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { PageFrame } from "@/components/PageFrame";
import { RepoListing } from "@/components/repository/RepoListing";
import { getToolsByCategory } from "@/lib/repository/queries";
import { categoryFromSlug } from "@/lib/repository/types";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = categoryFromSlug(slug);
  if (!category) return { title: "Category not found | TrackMCP" };
  const canonical = `https://trackmcp.com/category/${slug}`;
  return {
    title: `${category} — MCP servers | TrackMCP`,
    description: `Browse ${category} Model Context Protocol servers and tools in the TrackMCP directory, ranked by GitHub stars.`,
    alternates: { canonical },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = categoryFromSlug(slug);
  if (!category) notFound();

  const tools = await getToolsByCategory(category, 300);
  return (
    <>
      <Nav />
      <main className="flex-1">
        <PageFrame>
          <RepoListing
            eyebrow="MCP Repository · Categories"
            title={category}
            subtitle={`${tools.length.toLocaleString()} MCP servers and tools in ${category}, ranked by GitHub stars.`}
            tools={tools}
          />
        </PageFrame>
      </main>
      <Footer />
    </>
  );
}
