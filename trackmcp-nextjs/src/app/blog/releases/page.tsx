import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { PageFrame } from "@/components/PageFrame";
import { Reveal } from "@/components/Reveal";
import { BlogArt } from "../art";
import { enrichment } from "../enrichment";
import { posts } from "../posts";
import { breadcrumbJsonLd, pageMeta, serializeJsonLd } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "TrackMCP Releases | Product updates and MCP observability",
  description:
    "Read TrackMCP product releases covering MCP observability, server telemetry, analytics correctness, privacy, and production monitoring.",
  path: "/blog/releases",
});

export default function ReleasesPage() {
  const releases = posts.filter((post) => post.section === "releases");
  const breadcrumbSchema = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: "Releases", path: "/blog/releases" },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbSchema) }} />
      <Nav />
      <main className="flex-1">
        <PageFrame>
          <section className="relative overflow-hidden border-b border-line">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[240px] bg-squares dots-mask-top opacity-70" />
            <div className="relative mx-auto max-w-6xl px-6 py-16">
              <Reveal>
                <span className="text-[12px] font-medium uppercase tracking-[0.04em] text-brand">Blog</span>
                <h1 className="mt-3 text-[36px] font-medium leading-[1.05] tracking-[-0.03em] text-ink sm:text-[48px]">
                  TrackMCP releases
                </h1>
                <p className="mt-4 max-w-[56ch] text-[16px] leading-[1.5] text-muted sm:text-[18px]">
                  Product updates for MCP server observability, with the boundaries and verification details that matter in production.
                </p>
              </Reveal>
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-6 py-16" aria-labelledby="release-list">
            <div className="flex items-end justify-between gap-4">
              <h2 id="release-list" className="text-[13px] font-semibold uppercase tracking-wide text-faint">
                Product releases
              </h2>
              <Link href="/blog" className="text-[13px] font-medium text-brand-strong underline underline-offset-2 hover:text-ink">
                All posts
              </Link>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {releases.map((post, index) => (
                <Reveal key={post.slug} delay={index * 0.07} y={22}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="lift group grid h-full overflow-hidden rounded-2xl border border-line bg-white transition-colors hover:border-line-strong sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
                  >
                    <BlogArt
                      art={enrichment[post.slug]?.art ?? "default"}
                      fit="slice"
                      ariaLabel={`${post.title} illustration`}
                      className="block h-48 w-full border-b border-line sm:h-full sm:border-b-0 sm:border-r"
                    />
                    <div className="flex flex-col p-6">
                      <span className="inline-flex w-fit rounded-full bg-brand-soft px-2.5 py-0.5 text-[12px] font-medium text-brand-strong">
                        {post.tag}
                      </span>
                      <h3 className="mt-4 text-[21px] font-medium leading-snug tracking-[-0.02em] text-ink">{post.title}</h3>
                      <p className="mt-3 flex-1 text-[14.5px] leading-relaxed text-muted">{post.excerpt}</p>
                      <div className="mt-5 flex items-center gap-3 text-[12.5px] text-faint">
                        <span>{post.date}</span>
                        <span>·</span>
                        <span>{post.read}</span>
                        <ArrowUpRight size={16} className="ml-auto text-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </div>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </section>
        </PageFrame>
      </main>
      <Footer />
    </>
  );
}
