import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { PageFrame } from "@/components/PageFrame";
import { RepoCTA } from "@/components/repository/RepoListing";
import { getCategoryCounts } from "@/lib/repository/queries";
import { CATEGORIES, categorySlug } from "@/lib/repository/types";

export const metadata: Metadata = pageMeta({
  title: "MCP categories — browse MCP servers by category | TrackMCP",
  description:
    "Browse Model Context Protocol servers by category: AI & ML, developer kits, infrastructure, search, automation, and more.",
  path: "/categories",
});

export const revalidate = 3600;

const TILES = [
  "bg-violet-100 text-violet-600",
  "bg-sky-100 text-sky-600",
  "bg-brand-soft text-brand-strong",
  "bg-amber-100 text-amber-600",
  "bg-teal-100 text-teal-600",
  "bg-rose-100 text-rose-600",
  "bg-slate-100 text-slate-600",
  "bg-violet-100 text-violet-600",
  "bg-sky-100 text-sky-600",
];

export default async function CategoriesPage() {
  const counts = await getCategoryCounts();
  return (
    <>
      <Nav />
      <main className="flex-1">
        <PageFrame>
          <section className="border-b border-line">
            <div className="mx-auto max-w-6xl px-6 py-12">
              <Link
                href="/repository"
                className="text-[12px] font-medium uppercase tracking-[0.04em] text-brand transition-colors hover:text-brand-strong"
              >
                MCP Repository
              </Link>
              <h1 className="mt-3 text-[32px] font-medium leading-[1.08] tracking-[-0.03em] text-ink sm:text-[42px]">
                Browse by category
              </h1>
              <p className="mt-3 max-w-[60ch] text-[16px] leading-[1.5] text-muted">
                Find the right MCP servers for what you are building, grouped by what they do.
              </p>
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-6 py-12">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {CATEGORIES.map((c, i) => (
                <Link
                  key={c.id}
                  href={`/category/${categorySlug(c.id)}`}
                  className="lift group flex items-center justify-between rounded-2xl border border-line bg-white p-5 transition-colors hover:border-line-strong"
                >
                  <div className="flex items-center gap-3">
                    <span className={`grid h-10 w-10 place-items-center rounded-lg text-[15px] font-semibold ${TILES[i % TILES.length]}`}>
                      {c.label.slice(0, 1)}
                    </span>
                    <div>
                      <div className="text-[15px] font-medium text-ink">{c.id}</div>
                      <div className="text-[12.5px] text-muted">
                        {(counts[c.id] || 0).toLocaleString()} tools
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-faint transition-colors group-hover:text-ink" />
                </Link>
              ))}
            </div>
          </section>

          <RepoCTA />
        </PageFrame>
      </main>
      <Footer />
    </>
  );
}
