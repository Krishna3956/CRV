"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Package, ChevronDown, ArrowRight } from "lucide-react";
import type { McpTool } from "@/lib/repository/types";
import { searchToolsAction, toolsByCategoryAction } from "@/lib/repository/actions";
import { SearchBar } from "./SearchBar";
import { FilterBar } from "./FilterBar";
import { CategoryFilter } from "./CategoryFilter";
import { SubmitToolDialog } from "./SubmitToolDialog";
import { ToolCard } from "./ToolCard";
import { EarlyAccessButton } from "@/components/EarlyAccessButton";

/* Browse view for the MCP directory: search, category, sort, and "Reveal more"
   pagination — ported from the live home-client, restyled to TrackMCP. Initial
   tools are server-rendered (SEO); search + category fetch more on demand. */

export function BrowseClient({
  initialTools,
  totalCount,
}: {
  initialTools: McpTool[];
  totalCount: number;
}) {
  const [input, setInput] = useState("");
  const [sortBy, setSortBy] = useState("stars");
  const [category, setCategory] = useState("all");
  const [visible, setVisible] = useState(12);
  const [tools, setTools] = useState<McpTool[]>(initialTools);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingCat, setLoadingCat] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  // The grid filters instantly off `input`; this debounced fetch just pulls in
  // matches that aren't in the initially loaded set (top tools by stars).
  useEffect(() => {
    if (input.trim().length < 2) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      setLoadingSearch(true);
      try {
        const results = await searchToolsAction(input, 500);
        if (cancelled) return;
        setTools((prev) => {
          const ids = new Set(prev.map((x) => x.id));
          return [...prev, ...results.filter((x) => !ids.has(x.id))];
        });
      } finally {
        if (!cancelled) setLoadingSearch(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [input]);

  // fetch a category's tools on demand
  useEffect(() => {
    if (category === "all") return;
    let cancelled = false;
    (async () => {
      setVisible(12);
      setLoadingCat(true);
      try {
        const rows = await toolsByCategoryAction(category, 500);
        if (cancelled) return;
        setTools((prev) => {
          const ids = new Set(prev.map((x) => x.id));
          return [...prev, ...rows.filter((x) => !ids.has(x.id))];
        });
      } finally {
        if (!cancelled) setLoadingCat(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [category]);

  const q = input.trim().toLowerCase();
  const filtered = useMemo(() => {
    return tools
      .filter((t) => t.repo_name && t.github_url)
      .filter((t) => (category === "all" ? true : t.category === category))
      .filter(
        (t) =>
          !q ||
          t.repo_name?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.topics?.some((tp) => tp.toLowerCase().includes(q))
      )
      .sort((a, b) => {
        if (sortBy === "recent")
          return new Date(b.last_updated || 0).getTime() - new Date(a.last_updated || 0).getTime();
        if (sortBy === "name") return (a.repo_name || "").localeCompare(b.repo_name || "");
        return (b.stars || 0) - (a.stars || 0);
      });
  }, [tools, q, category, sortBy]);

  const trending = useMemo(() => {
    const top = [...tools].sort((a, b) => (b.stars || 0) - (a.stars || 0)).slice(0, 5);
    return new Set(top.map((t) => t.id));
  }, [tools]);

  const displayed = q ? filtered : filtered.slice(0, visible);
  const hasMore = !q && visible < filtered.length;
  const activeFilters = (category !== "all" ? 1 : 0) + (q ? 1 : 0);
  const availableLabel = q || category !== "all" ? filtered.length : totalCount + 10000;

  return (
    <>
      {/* hero */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[300px] bg-squares dots-mask-top opacity-70" />
        <div className="relative mx-auto max-w-3xl px-6 py-14 text-center sm:py-16">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-[12px] font-medium text-brand shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" /> MCP Repository
          </span>
          <h1 className="mx-auto mt-5 max-w-[18ch] text-balance text-[34px] font-medium leading-[1.05] tracking-[-0.03em] text-ink sm:text-[46px]">
            The App Store for MCP
          </h1>
          <p className="mx-auto mt-4 max-w-[54ch] text-[16px] leading-[1.5] text-muted sm:text-[18px]">
            The world&apos;s largest MCP marketplace. Find the servers, clients, and tools
            you need, and explore what the community is building.
          </p>
          <div className="mt-7 flex justify-center">
            <SearchBar value={input} onChange={setInput} />
          </div>
        </div>
      </section>

      {/* filters */}
      <section className="mx-auto max-w-6xl px-6 pt-10">
        <CategoryFilter selected={category} onChange={setCategory} />
      </section>

      {/* directory */}
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <p className="text-[18px] font-semibold text-ink">
              {availableLabel.toLocaleString()} available
            </p>
            {activeFilters > 0 && (
              <button
                type="button"
                onClick={() => {
                  setCategory("all");
                  setInput("");
                }}
                className="inline-flex items-center gap-1 text-[12.5px] text-muted underline transition-colors hover:text-ink"
              >
                Clear filters
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <FilterBar sortBy={sortBy} onSortChange={setSortBy} />
            <SubmitToolDialog />
          </div>
        </div>

        {(loadingSearch || loadingCat) && filtered.length === 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl bg-mist" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center">
            <span className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-mist text-faint">
              <Package className="h-7 w-7" />
            </span>
            <h3 className="text-[18px] font-medium text-ink">No tools found</h3>
            <p className="mx-auto mt-2 max-w-md text-[14.5px] text-muted">
              Try a different search or category, or submit the first matching tool.
            </p>
          </div>
        ) : (
          <>
            <div ref={gridRef} className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {displayed.map((t) => (
                <ToolCard
                  key={t.id}
                  name={t.repo_name || "Unknown"}
                  description={t.description || ""}
                  stars={t.stars || 0}
                  githubUrl={t.github_url}
                  language={t.language || undefined}
                  topics={t.topics || undefined}
                  isTrending={trending.has(t.id)}
                />
              ))}
            </div>

            {hasMore && (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisible((v) => v + 12)}
                  className="inline-flex items-center gap-2 rounded-lg border border-line-strong bg-white px-6 py-3 text-[14px] font-medium text-ink shadow-sm transition-colors hover:bg-paper"
                >
                  Reveal more
                  <ChevronDown size={16} className="text-faint" />
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* product CTA — repository is lead-gen into TrackMCP */}
      <section className="border-t border-line bg-paper">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center">
          <span className="text-[12px] font-medium uppercase tracking-[0.04em] text-brand">
            Shipped an MCP server?
          </span>
          <h2 className="mx-auto mt-3 max-w-[22ch] text-[26px] font-medium leading-[1.12] tracking-[-0.02em] text-ink sm:text-[32px]">
            See who actually uses it, and what to fix
          </h2>
          <p className="mx-auto mt-3 max-w-[52ch] text-[15.5px] leading-[1.5] text-muted">
            TrackMCP is analytics for your MCP server. Wrap it in one line of code and see
            adoption, sessions, outcomes, and the silent failures hiding inside a 200 OK.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <EarlyAccessButton size="lg" />
            <Link
              href="/features"
              className="inline-flex items-center gap-1.5 text-[14.5px] font-medium text-body transition-colors hover:text-ink"
            >
              See the product <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
