"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";

const OPTIONS = [
  { key: "stars", label: "Most stars" },
  { key: "recent", label: "Recently updated" },
  { key: "name", label: "Name (A–Z)" },
];

export function FilterBar({
  sortBy,
  onSortChange,
}: {
  sortBy: string;
  onSortChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = OPTIONS.find((o) => o.key === sortBy) ?? OPTIONS[0];

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3.5 py-2.5 text-[13.5px] font-medium text-body shadow-sm transition-colors hover:border-line-strong"
      >
        Sort: <span className="text-ink">{current.label}</span>
        <ChevronDown size={14} className="text-faint" />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1.5 min-w-[190px] rounded-lg border border-line bg-white p-1 shadow-[0_16px_40px_-16px_rgba(10,10,10,0.3)]">
          {OPTIONS.map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => {
                onSortChange(o.key);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-[13px] text-body transition-colors hover:bg-mist"
            >
              {o.label}
              {o.key === sortBy && <Check size={14} className="text-brand-strong" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
