import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Lightbulb } from "lucide-react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { PageFrame } from "@/components/PageFrame";
import { Reveal } from "@/components/Reveal";
import { EarlyAccessButton } from "@/components/EarlyAccessButton";
import { PhotoAvatar } from "@/components/PhotoAvatar";
import { posts, getPost, type Block } from "../posts";
import { BlogArt } from "../art";
import { enrichment } from "../enrichment";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Not found | TrackMCP" };
  const canonical = `https://trackmcp.com/blog/${slug}`;
  return {
    title: `${post.title} | TrackMCP`,
    description: post.excerpt,
    alternates: { canonical },
    openGraph: { title: post.title, description: post.excerpt, url: canonical, type: "article" },
  };
}

function Blocks({ body }: { body: Block[] }) {
  const firstPara = body.findIndex((b) => b.t === "p");
  return (
    <div className="flex flex-col gap-5">
      {body.map((b, i) => {
        if (b.t === "h2")
          return (
            <h2
              key={i}
              id={slugify(b.c)}
              className="mt-6 scroll-mt-24 border-t border-line pt-6 text-[24px] font-medium tracking-[-0.02em] text-ink"
            >
              {b.c}
            </h2>
          );
        if (b.t === "ul")
          return (
            <ul key={i} className="flex flex-col gap-2.5">
              {b.c.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[16.5px] leading-[1.6] text-body">
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  {item}
                </li>
              ))}
            </ul>
          );
        if (b.t === "code")
          return (
            <pre
              key={i}
              className="overflow-x-auto rounded-xl border border-code-line bg-code-bg p-4 font-mono text-[12.5px] leading-relaxed text-code-text"
            >
              <code>{b.c}</code>
            </pre>
          );
        if (b.t === "quote")
          return (
            <blockquote
              key={i}
              className="my-2 border-l-2 border-brand pl-5 text-[20px] font-medium leading-snug text-ink"
            >
              {b.c}
            </blockquote>
          );
        if (b.t === "figure")
          return (
            <figure key={i} className="my-2 overflow-hidden rounded-xl border border-line">
              <BlogArt art={b.art} className="block h-auto w-full" />
              <figcaption className="border-t border-line bg-paper px-4 py-2.5 text-[13px] leading-relaxed text-muted">
                {b.c}
              </figcaption>
            </figure>
          );
        if (b.t === "callout")
          return (
            <aside key={i} className="my-2 rounded-xl border border-brand/25 bg-brand-soft/40 p-4">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-brand-strong">
                <Lightbulb size={15} /> {b.title}
              </div>
              <p className="mt-1.5 text-[15.5px] leading-relaxed text-body">{b.c}</p>
            </aside>
          );
        return (
          <p
            key={i}
            className={`text-[16.5px] leading-[1.75] text-body ${
              i === firstPara
                ? "first-letter:float-left first-letter:mr-2.5 first-letter:mt-1 first-letter:text-[52px] first-letter:font-semibold first-letter:leading-[0.8] first-letter:text-ink"
                : ""
            }`}
          >
            {b.c}
          </p>
        );
      })}
    </div>
  );
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const enr = enrichment[slug];
  // Splice figures/callouts into the body at their target positions.
  const body: Block[] = [...post.body];
  if (enr?.inserts) {
    [...enr.inserts]
      .sort((a, b) => b.after - a.after)
      .forEach((ins) => body.splice(ins.after + 1, 0, ins.block));
  }
  const headings = body.filter(
    (b): b is Extract<Block, { t: "h2" }> => b.t === "h2"
  );
  const cover = enr?.art ?? "default";
  const more = posts.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <>
      <Nav />
      <main className="flex-1">
        <PageFrame>
          <div className="mx-auto max-w-5xl px-6 py-12 sm:py-14">
            {/* header */}
            <Reveal>
              <Link
                href="/blog"
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted transition-colors hover:text-ink"
              >
                <ArrowLeft size={14} /> All posts
              </Link>
              <div className="mt-6 flex items-center gap-3 text-[12.5px] text-faint">
                <span className="rounded-full bg-brand-soft px-2.5 py-0.5 font-medium text-brand-strong">
                  {post.tag}
                </span>
                <span>{post.date}</span>
                <span>·</span>
                <span>{post.read}</span>
              </div>
              <h1 className="mt-4 max-w-[20ch] text-[32px] font-medium leading-[1.08] tracking-[-0.03em] text-ink sm:text-[44px]">
                {post.title}
              </h1>
              <p className="mt-4 max-w-[62ch] text-[18px] leading-[1.5] text-muted">
                {post.excerpt}
              </p>
              <div className="mt-6 flex items-center gap-3">
                <PhotoAvatar src="/krishna-goyal.jpg" name="Krishna Goyal" size={40} />
                <span className="text-[13.5px] leading-tight">
                  <span className="block font-medium text-ink">Krishna Goyal</span>
                  <span className="block text-faint">Founder, TrackMCP</span>
                </span>
              </div>
            </Reveal>

            {/* cover */}
            <Reveal y={24}>
              <div className="mt-8 overflow-hidden rounded-2xl border border-line">
                <BlogArt
                  art={cover}
                  fit="slice"
                  className="block h-[220px] w-full sm:h-[300px]"
                />
              </div>
            </Reveal>

            {/* body + toc */}
            <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_216px]">
              <article className="min-w-0">
                {enr?.takeaways && (
                  <div className="mb-8 rounded-2xl border border-line bg-paper p-5 sm:p-6">
                    <div className="text-[12px] font-semibold uppercase tracking-wide text-brand">
                      Key takeaways
                    </div>
                    <ul className="mt-3 flex flex-col gap-2.5">
                      {enr.takeaways.map((t) => (
                        <li
                          key={t}
                          className="flex items-start gap-2.5 text-[15px] leading-[1.5] text-body"
                        >
                          <Check size={16} className="mt-0.5 shrink-0 text-brand" />
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <Reveal>
                  <Blocks body={body} />
                </Reveal>

                {/* CTA */}
                <div className="mt-12 overflow-hidden rounded-2xl border border-line bg-brand-soft/40 p-6 text-center sm:p-8">
                  <h3 className="text-[20px] font-medium tracking-[-0.02em] text-ink">
                    See this on your own server
                  </h3>
                  <p className="mx-auto mt-2 max-w-[46ch] text-[14.5px] leading-relaxed text-muted">
                    TrackMCP turns your MCP server&apos;s calls into adoption,
                    workflows, and outcomes. One line to install.
                  </p>
                  <div className="mt-5 flex justify-center">
                    <EarlyAccessButton size="md" />
                  </div>
                </div>
              </article>

              {/* table of contents */}
              <aside className="hidden lg:block">
                <div className="sticky top-24">
                  <div className="text-[12px] font-semibold uppercase tracking-wide text-faint">
                    On this page
                  </div>
                  <nav className="mt-3 flex flex-col gap-2 border-l border-line">
                    {headings.map((h) => (
                      <a
                        key={h.c}
                        href={`#${slugify(h.c)}`}
                        className="-ml-px border-l border-transparent pl-3 text-[13px] leading-snug text-muted transition-colors hover:border-brand hover:text-ink"
                      >
                        {h.c}
                      </a>
                    ))}
                  </nav>
                </div>
              </aside>
            </div>
          </div>

          {/* more posts */}
          <section className="mx-auto max-w-5xl px-6 pb-16">
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-faint">
              Keep reading
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {more.map((m) => {
                const mArt = enrichment[m.slug]?.art ?? "default";
                return (
                  <Link
                    key={m.slug}
                    href={`/blog/${m.slug}`}
                    className="lift group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white transition-colors hover:border-line-strong"
                  >
                    <BlogArt
                      art={mArt}
                      fit="slice"
                      className="block h-28 w-full border-b border-line"
                    />
                    <div className="flex flex-1 flex-col p-4">
                      <span className="text-[11px] font-medium uppercase tracking-wide text-brand">
                        {m.tag}
                      </span>
                      <span className="mt-2 text-[14.5px] font-medium leading-snug text-ink">
                        {m.title}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        </PageFrame>
      </main>
      <Footer />
    </>
  );
}
