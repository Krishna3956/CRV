import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { PageFrame } from "@/components/PageFrame";
import { Reveal } from "@/components/Reveal";
import { posts } from "./posts";
import { BlogArt } from "./art";
import { enrichment } from "./enrichment";

export const metadata: Metadata = pageMeta({
  title: "Blog | TrackMCP",
  description:
    "Notes on the Model Context Protocol, MCP analytics, and building AI tools you can measure.",
  path: "/blog",
});

export default function BlogPage() {
  const [featured, ...rest] = posts;
  return (
    <>
      <Nav />
      <main className="flex-1">
        <PageFrame>
          <section className="relative overflow-hidden border-b border-line">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[240px] bg-squares dots-mask-top opacity-70" />
            <div className="relative mx-auto max-w-6xl px-6 py-16">
              <Reveal>
                <span className="text-[12px] font-medium uppercase tracking-[0.04em] text-brand">
                  Blog
                </span>
                <h1 className="mt-3 text-[36px] font-medium leading-[1.05] tracking-[-0.03em] text-ink sm:text-[48px]">
                  Notes on MCP analytics
                </h1>
                <p className="mt-4 max-w-[56ch] text-[16px] leading-[1.5] text-muted sm:text-[18px]">
                  Playbooks and deep dives on measuring the usage of your MCP
                  server: adoption, workflows, silent failures, and what to fix.
                </p>
              </Reveal>
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-6 py-16">
            {/* featured */}
            <Reveal y={24}>
              <Link
                href={`/blog/${featured.slug}`}
                className="lift group grid overflow-hidden rounded-2xl border border-line bg-white transition-colors hover:border-line-strong md:grid-cols-2"
              >
                <div className="relative min-h-[240px] overflow-hidden border-b border-line md:border-b-0 md:border-r">
                  <BlogArt
                    art={enrichment[featured.slug]?.art ?? "default"}
                    fit="slice"
                    className="absolute inset-0 h-full w-full"
                  />
                </div>
                <div className="p-8">
                  <span className="inline-flex rounded-full bg-brand-soft px-2.5 py-0.5 text-[12px] font-medium text-brand-strong">
                    {featured.tag}
                  </span>
                  <h2 className="mt-4 text-[26px] font-medium leading-tight tracking-[-0.02em] text-ink">
                    {featured.title}
                  </h2>
                  <p className="mt-3 text-[15px] leading-relaxed text-muted">
                    {featured.excerpt}
                  </p>
                  <div className="mt-5 flex items-center gap-3 text-[13px] text-faint">
                    <span>{featured.date}</span>
                    <span>·</span>
                    <span>{featured.read}</span>
                    <ArrowUpRight
                      size={16}
                      className="ml-auto text-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </div>
                </div>
              </Link>
            </Reveal>

            {/* grid */}
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {rest.map((post, i) => (
                <Reveal key={post.slug} delay={(i % 3) * 0.07} y={22}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="lift group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white transition-colors hover:border-line-strong"
                  >
                    <BlogArt
                      art={enrichment[post.slug]?.art ?? "default"}
                      fit="slice"
                      className="block h-36 w-full border-b border-line"
                    />
                    <div className="flex flex-1 flex-col p-6">
                      <span className="inline-flex w-fit rounded-full bg-mist px-2.5 py-0.5 text-[12px] font-medium text-muted">
                        {post.tag}
                      </span>
                      <h3 className="mt-4 text-[18px] font-medium leading-snug tracking-[-0.01em] text-ink">
                        {post.title}
                      </h3>
                      <p className="mt-2 flex-1 text-[14px] leading-relaxed text-muted">
                        {post.excerpt}
                      </p>
                      <div className="mt-5 flex items-center gap-2 text-[12.5px] text-faint">
                        <span>{post.date}</span>
                        <span>·</span>
                        <span>{post.read}</span>
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
