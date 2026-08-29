"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X, ChevronDown, LayoutGrid, Sparkles, TrendingUp, Boxes, Plus } from "lucide-react";
import { TrackMCPLogo } from "./TrackMCPLogo";
import { EarlyAccessButton } from "./EarlyAccessButton";

const links = [
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Docs", href: "/docs" },
  { label: "Blog", href: "/blog" },
];

const repoLinks = [
  { label: "Browse all", href: "/repository", desc: "Search every MCP server", icon: LayoutGrid, tile: "bg-slate-100 text-slate-600" },
  { label: "What's new", href: "/new", desc: "Latest additions", icon: Sparkles, tile: "bg-sky-100 text-sky-600" },
  { label: "Popular", href: "/top-mcp", desc: "Top by GitHub stars", icon: TrendingUp, tile: "bg-amber-100 text-amber-600" },
  { label: "Categories", href: "/categories", desc: "Browse by what they do", icon: Boxes, tile: "bg-violet-100 text-violet-600" },
  { label: "Submit your MCP", href: "/submit-mcp", desc: "Add your MCP server", icon: Plus, tile: "bg-brand-soft text-brand-strong" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b bg-white/85 backdrop-blur-sm transition-colors ${
        scrolled ? "border-line" : "border-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <TrackMCPLogo mark />

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-[15px] text-body transition-colors hover:text-ink"
            >
              {l.label}
            </Link>
          ))}

          {/* Repository dropdown */}
          <div className="group relative">
            <Link
              href="/repository"
              className="inline-flex items-center gap-1 text-[15px] text-body transition-colors hover:text-ink"
            >
              Repository
              <ChevronDown size={14} className="text-faint transition-transform group-hover:rotate-180" />
            </Link>
            <div className="invisible absolute left-1/2 top-full z-50 w-[300px] -translate-x-1/2 pt-3 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
              <div className="rounded-xl border border-line bg-white p-1.5 shadow-[0_20px_50px_-20px_rgba(10,10,10,0.35)]">
                {repoLinks.map((r) => (
                  <Link
                    key={r.href}
                    href={r.href}
                    className="flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-mist"
                  >
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${r.tile}`}>
                      <r.icon size={16} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13.5px] font-medium text-ink">{r.label}</span>
                      <span className="block truncate text-[12px] text-muted">{r.desc}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="https://app.trackmcp.com/signin"
            className="hidden text-[15px] text-body transition-colors hover:text-ink sm:block"
          >
            Sign in
          </Link>
          <EarlyAccessButton size="sm" className="hidden sm:inline-flex" />
          <button
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-lg border border-line-strong md:hidden"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-line bg-white px-6 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="py-1 text-[15px] text-body"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-1 border-t border-line pt-3">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-faint">
                Repository
              </span>
              {repoLinks.map((r) => (
                <Link
                  key={r.href}
                  href={r.href}
                  onClick={() => setOpen(false)}
                  className="mt-2 flex items-center gap-2.5 text-[15px] text-body"
                >
                  <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${r.tile}`}>
                    <r.icon size={14} />
                  </span>
                  {r.label}
                </Link>
              ))}
            </div>
            <EarlyAccessButton size="sm" className="mt-3 w-full" />
          </div>
        </div>
      )}
    </header>
  );
}
