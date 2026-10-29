"use client";

import { useEffect, useState } from "react";
import {
  browserPrefersSimplifiedChinese,
  dismissLanguageSuggestion,
  hasDismissedLanguageSuggestion,
  readSiteLocale,
  writeSiteLocale,
  type SiteLocale,
} from "./site-locale";

export function LanguageSuggestion() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Do not prompt visitors who have already made an explicit choice or
    // dismissed this suggestion. The browser preference is only a hint.
    if (readSiteLocale() !== "en" || hasDismissedLanguageSuggestion() || !browserPrefersSimplifiedChinese()) return;
    const timer = window.setTimeout(() => setVisible(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const choose = (locale: SiteLocale) => {
    writeSiteLocale(locale);
    dismissLanguageSuggestion();
    setVisible(false);
    window.dispatchEvent(new CustomEvent("trackmcp:locale-change", { detail: { locale } }));
  };

  if (!visible) return null;

  return (
    <aside
      role="status"
      aria-label="Language suggestion"
      className="fixed inset-x-4 bottom-4 z-[75] mx-auto flex max-w-md items-center justify-between gap-4 rounded-xl border border-line bg-white px-4 py-3 text-[13px] text-body shadow-[0_20px_50px_-20px_rgba(10,10,10,0.35)] sm:inset-x-auto sm:right-6 sm:w-auto"
    >
      <span>是否切换为简体中文？</span>
      <span className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => choose("zh-CN")}
          className="rounded-lg bg-ink px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-body"
        >
          切换为中文
        </button>
        <button
          type="button"
          onClick={() => choose("en")}
          className="rounded-lg border border-line-strong px-3 py-1.5 text-[12px] font-medium text-body transition-colors hover:border-ink hover:text-ink"
        >
          Continue in English
        </button>
      </span>
    </aside>
  );
}
