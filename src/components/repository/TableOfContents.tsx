"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { flattenToc, type TocItem } from "@/lib/repository/toc";

/* Sticky "On this page" table of contents. Highlights the section in view via
   IntersectionObserver and smooth-scrolls on click. Restyled to TrackMCP. */

export function TableOfContents({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState("");
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const headings = document.querySelectorAll("h2[id], h3[id], h4[id]");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    headings.forEach((h) => observer.observe(h));
    return () => headings.forEach((h) => observer.unobserve(h));
  }, []);

  const go = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setActiveId(id);
  };

  const render = (list: TocItem[], depth = 0) => (
    <ul className={depth > 0 ? "ml-3 border-l border-line" : ""}>
      {list.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            onClick={() => go(item.id)}
            aria-current={activeId === item.id ? "location" : undefined}
            className={`block w-full rounded-md px-2.5 py-1.5 text-left text-[12.5px] leading-snug transition-colors ${
              activeId === item.id
                ? "bg-brand-soft font-medium text-brand-strong"
                : "text-muted hover:bg-mist hover:text-body"
            }`}
          >
            {item.text}
          </button>
          {item.children && item.children.length > 0 && render(item.children, depth + 1)}
        </li>
      ))}
    </ul>
  );

  if (!items || items.length === 0) return null;

  return (
    <nav className="rounded-xl border border-line bg-white p-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="mb-2 flex w-full items-center justify-between border-b border-line pb-2"
      >
        <span className="flex items-center gap-2 text-[12px] font-semibold text-ink">
          <span className="h-3.5 w-1 rounded-full bg-brand" /> On this page
        </span>
        <ChevronDown size={14} className={`text-faint transition-transform ${open ? "" : "-rotate-90"}`} />
      </button>
      {open && <div className="max-h-[60vh] overflow-y-auto pr-1">{render(items)}</div>}

      {/* SEO: crawlable anchor list */}
      <div className="sr-only" role="doc-toc">
        <ul>
          {flattenToc(items).map((it) => (
            <li key={it.id}>
              <a href={`#${it.id}`}>{it.text}</a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
