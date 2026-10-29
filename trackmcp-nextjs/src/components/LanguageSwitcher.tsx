"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Globe2 } from "lucide-react";
import { readSiteLocale, writeSiteLocale, type SiteLocale } from "./site-locale";

const LOCALES: { value: SiteLocale; label: string; short: string }[] = [
  { value: "en", label: "English", short: "EN" },
  { value: "zh-CN", label: "中文（简体）", short: "中文" },
];

export function LanguageSwitcher() {
  const [locale, setLocale] = useState<SiteLocale>(readSiteLocale);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "translating" | "error">("idle");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onStatus = (event: Event) => {
      const next = (event as CustomEvent<{ status?: string }>).detail?.status;
      if (next === "translating") setStatus("translating");
      else if (next === "error") { setStatus("error"); setLocale("en"); }
      else if (next === "ready") setStatus("idle");
    };
    const onOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("trackmcp:translation-status", onStatus);
    document.addEventListener("mousedown", onOutside);
    return () => {
      window.removeEventListener("trackmcp:translation-status", onStatus);
      document.removeEventListener("mousedown", onOutside);
    };
  }, []);

  useEffect(() => {
    writeSiteLocale(locale);
  }, [locale]);

  const choose = (next: SiteLocale) => {
    setOpen(false);
    setLocale(next);
    window.dispatchEvent(new CustomEvent("trackmcp:locale-change", { detail: { locale: next } }));
  };

  const active = LOCALES.find((item) => item.value === locale) || LOCALES[0];
  return (
    <div ref={ref} data-no-translate className="relative" aria-label="Language selector">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Language: ${active.label}`}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line-strong bg-white px-2.5 text-[12px] font-medium text-body shadow-sm transition-colors hover:border-ink hover:text-ink"
      >
        <Globe2 size={15} aria-hidden="true" />
        <span>{status === "translating" ? "Translating…" : active.short}</span>
        <ChevronDown size={13} className={open ? "rotate-180 transition-transform" : "transition-transform"} aria-hidden="true" />
      </button>
      {open && (
        <div role="listbox" aria-label="Choose language" className="absolute right-0 top-full z-[80] mt-2 min-w-[176px] rounded-xl border border-line bg-white p-1.5 shadow-[0_20px_50px_-20px_rgba(10,10,10,0.35)]">
          {LOCALES.map((item) => (
            <button
              key={item.value}
              type="button"
              role="option"
              aria-selected={locale === item.value}
              onClick={() => choose(item.value)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[13px] text-body transition-colors hover:bg-mist"
            >
              <span>{item.label}</span>
              {locale === item.value && <Check size={14} className="text-brand-strong" aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
