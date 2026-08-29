"use client";

import { CATEGORIES } from "@/lib/repository/types";

const ALL = [{ id: "all", label: "All" }, ...CATEGORIES];

export function CategoryFilter({
  selected,
  onChange,
}: {
  selected: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {ALL.map((c) => {
        const on = selected === c.id;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onChange(c.id)}
            className={`rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
              on
                ? "border-brand bg-brand-soft text-brand-strong"
                : "border-line bg-white text-muted hover:border-line-strong hover:text-body"
            }`}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
}
