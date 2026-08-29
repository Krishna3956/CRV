"use client";

import { Search } from "lucide-react";

export function SearchBar({
  value,
  onChange,
  placeholder = "Search by name, description, or tags...",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative w-full max-w-xl">
      <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-faint" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search the MCP directory"
        className="w-full rounded-full border border-line-strong bg-white py-3 pl-11 pr-4 text-[15px] text-ink shadow-sm outline-none transition-colors placeholder:text-faint focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
    </div>
  );
}
