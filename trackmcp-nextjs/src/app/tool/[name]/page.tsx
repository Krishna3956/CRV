import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Star, GitBranch, Calendar, ExternalLink } from "lucide-react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { PageFrame } from "@/components/PageFrame";
import { MarkdownRenderer } from "@/components/repository/MarkdownRenderer";
import { ToolCard } from "@/components/repository/ToolCard";
import { getToolByName, getReadme, getTopTools, relatedTools } from "@/lib/repository/queries";
import { ownerFromUrl, repoPathFromUrl, toolSlug } from "@/lib/repository/types";
import { extractHeadings, shouldShowToc, generateTocSchema } from "@/lib/repository/toc";
import { TableOfContents } from "@/components/repository/TableOfContents";
import { metaDescription } from "@/lib/seo";

export const revalidate = 21600;
export const dynamic = "force-static";

function fmtDate(s: string) {
  try {
    return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return s;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>;
}): Promise<Metadata> {
  const { name } = await params;
  const tool = await getToolByName(name);
  if (!tool) return { title: "Tool not found | TrackMCP" };
  const repo = tool.repo_name || decodeURIComponent(name);
  const slug = toolSlug(tool.github_url, repo);
  const desc = metaDescription(
    tool.description ||
      `${repo} — an MCP server in the TrackMCP directory. Explore its docs, stars, and usage.`,
    `${repo} is a Model Context Protocol server listed in the TrackMCP directory. Explore its documentation, GitHub repository, and usage details.`,
  );
  const canonical = `https://trackmcp.com/tool/${encodeURIComponent(slug)}`;
  const title = `${repo} — MCP server | TrackMCP`;
  return {
    title,
    description: desc,
    alternates: { canonical },
    openGraph: {
      title: `${repo} — MCP server`,
      description: desc,
      url: canonical,
      type: "website",
      images: [{ url: `${canonical}/opengraph-image`, width: 1200, height: 630, alt: `${repo} MCP server` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: [`${canonical}/opengraph-image`],
    },
  };
}

export default async function ToolPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const tool = await getToolByName(name);
  if (!tool) notFound();

  const owner = ownerFromUrl(tool.github_url);
  const [readme, pool] = await Promise.all([
    getReadme(repoPathFromUrl(tool.github_url)),
    getTopTools(300),
  ]);
  const related = relatedTools(tool, pool, 6);
  const toc = readme ? extractHeadings(readme) : [];
  const showToc = shouldShowToc(toc);
  const toolUrl = `https://trackmcp.com/tool/${encodeURIComponent(toolSlug(tool.github_url, tool.repo_name || name))}`;

  const faqs = [
    {
      q: `What is ${tool.repo_name}?`,
      a: tool.description
        ? `${tool.repo_name} is ${tool.description}`
        : `${tool.repo_name} is a Model Context Protocol (MCP) server listed in the TrackMCP directory.`,
    },
    {
      q: `How do I install ${tool.repo_name}?`,
      a: `Open the GitHub repository and follow its README. Most MCP servers are added to your client's MCP config, then called by your agent.`,
    },
    {
      q: `Is ${tool.repo_name} open source?`,
      a: `Yes — it is hosted on GitHub at ${tool.github_url}${
        tool.stars ? ` and has ${tool.stars.toLocaleString()} stars` : ""
      }.`,
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareSourceCode",
        name: tool.repo_name,
        description: tool.description || undefined,
        url: toolUrl,
        codeRepository: tool.github_url,
        programmingLanguage: tool.language || undefined,
        keywords: tool.topics?.join(", ") || undefined,
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "MCP Repository", item: "https://trackmcp.com/repository" },
          { "@type": "ListItem", position: 2, name: tool.repo_name, item: toolUrl },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {showToc && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(generateTocSchema(toc, toolUrl)) }}
        />
      )}
      <Nav />
      <main className="flex-1">
        <PageFrame>
          <div className="mx-auto max-w-4xl px-6 py-10">
            <Link
              href="/repository"
              className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-muted transition-colors hover:text-ink"
            >
              <ArrowLeft size={15} /> Back to directory
            </Link>

            <header className="mt-6 border-b border-line pb-8">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  {owner && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`https://github.com/${owner}.png?size=80`}
                      alt={owner}
                      width={40}
                      height={40}
                      className="h-10 w-10 shrink-0 rounded-full border border-line bg-paper object-cover"
                    />
                  )}
                  <h1 className="truncate text-[30px] font-medium tracking-[-0.02em] text-ink sm:text-[36px]">
                    {tool.repo_name}
                  </h1>
                </div>
                <a
                  href={tool.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-ink px-3.5 py-2 text-[13.5px] font-medium text-white transition-colors hover:bg-black"
                >
                  <ExternalLink size={14} /> View on GitHub
                </a>
              </div>

              {tool.description && (
                <p className="mt-5 max-w-[70ch] text-[16px] leading-relaxed text-muted">
                  {tool.description}
                </p>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-5 text-[13px]">
                <span className="inline-flex items-center gap-1.5 text-body">
                  <Star size={14} className="fill-amber-400 text-amber-400" />
                  <span className="font-medium">{(tool.stars || 0).toLocaleString()} stars</span>
                </span>
                {tool.language && (
                  <span className="inline-flex items-center gap-1.5 text-muted">
                    <GitBranch size={14} /> {tool.language}
                  </span>
                )}
                {tool.category && (
                  <Link
                    href={`/category/${categorySlugSafe(tool.category)}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-paper px-2.5 py-0.5 text-[12px] font-medium text-body transition-colors hover:text-ink"
                  >
                    {tool.category}
                  </Link>
                )}
                {tool.last_updated && (
                  <span className="inline-flex items-center gap-1.5 text-muted">
                    <Calendar size={14} /> Updated {fmtDate(tool.last_updated)}
                  </span>
                )}
              </div>

              {tool.topics && tool.topics.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {tool.topics.map((t) => (
                    <span key={t} className="rounded-md bg-paper px-2 py-0.5 text-[11px] font-medium text-muted">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </header>

            {readme ? (
              <div className="mt-8">
                <h2 className="text-[20px] font-semibold text-ink">Documentation</h2>
                <div className={showToc ? "mt-4 gap-8 lg:grid lg:grid-cols-[1fr_240px]" : "mt-4"}>
                  <div className="min-w-0 lg:order-1">
                    <MarkdownRenderer content={readme} githubUrl={tool.github_url} />
                  </div>
                  {showToc && (
                    <aside className="order-2 hidden lg:block">
                      <div className="sticky top-24">
                        <TableOfContents items={toc} />
                      </div>
                    </aside>
                  )}
                </div>
              </div>
            ) : (
              <p className="mt-8 text-[14.5px] text-muted">
                No README could be loaded. View the project on GitHub for full documentation.
              </p>
            )}

            {/* FAQ */}
            <section className="mt-12 border-t border-line pt-8">
              <h2 className="text-[20px] font-semibold text-ink">Frequently asked questions</h2>
              <div className="mt-4 flex flex-col gap-3">
                {faqs.map((f) => (
                  <div key={f.q} className="rounded-xl border border-line bg-white p-4">
                    <h3 className="text-[14.5px] font-medium text-ink">{f.q}</h3>
                    <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{f.a}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* related */}
            {related.length > 0 && (
              <section className="mt-12 border-t border-line pt-8">
                <h2 className="text-[20px] font-semibold text-ink">Related MCP tools</h2>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {related.map((t) => (
                    <ToolCard
                      key={t.id}
                      name={t.repo_name || "Unknown"}
                      description={t.description || ""}
                      stars={t.stars || 0}
                      githubUrl={t.github_url}
                      language={t.language || undefined}
                      topics={t.topics || undefined}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* product nudge */}
            <div className="mt-12 flex flex-col items-start justify-between gap-3 rounded-2xl border border-line bg-paper p-5 sm:flex-row sm:items-center">
              <p className="text-[14.5px] text-body">
                <span className="font-medium text-ink">Run your own MCP server?</span> See who uses it and what to fix.
              </p>
              <Link
                href="/features"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line-strong bg-white px-4 py-2 text-[13.5px] font-medium text-ink transition-colors hover:bg-paper"
              >
                Measure it with TrackMCP <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </PageFrame>
      </main>
      <Footer />
    </>
  );
}

function categorySlugSafe(id: string) {
  return id
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
