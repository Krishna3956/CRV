"use client";

import { useEffect } from "react";
import { readSiteLocale, type SiteLocale } from "./site-locale";

type TextRecord = { node: Text; original: string };
const originals = new Map<Text, string>();
const translated = new Set<Text>();
const translationCache = new Map<string, string>();
const MAX_CACHE_ENTRIES = 1_000;
let translationInFlight: Promise<void> | null = null;
let translationQueued = false;
let translationGeneration = 0;

function cacheTranslation(source: string, value: string) {
  translationCache.delete(source);
  translationCache.set(source, value);
  while (translationCache.size > MAX_CACHE_ENTRIES) {
    const oldest = translationCache.keys().next().value;
    if (oldest === undefined) break;
    translationCache.delete(oldest);
  }
}

function isExcluded(node: Text): boolean {
  const parent = node.parentElement;
  if (!parent) return true;
  if (parent.closest("[data-no-translate], script, style, noscript, textarea, input, select, option, pre, code, svg, [contenteditable='true'], [aria-hidden='true']")) return true;
  const text = node.nodeValue?.trim() || "";
  if (text.length < 2 || /^https?:\/\//i.test(text) || /^[-_./:@#$%{}[\]()<>=+*|\\\d\s]+$/.test(text)) return true;
  return false;
}

function collectTextNodes(): TextRecord[] {
  const records: TextRecord[] = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const textNode = node as Text;
    if (isExcluded(textNode)) continue;
    const original = originals.get(textNode) || textNode.nodeValue || "";
    if (!original.trim() || translated.has(textNode)) continue;
    originals.set(textNode, original);
    records.push({ node: textNode, original });
  }
  return records;
}

function emitStatus(status: "translating" | "ready" | "error") {
  window.dispatchEvent(new CustomEvent("trackmcp:translation-status", { detail: { status } }));
}

function restoreEnglish() {
  originals.forEach((original, node) => {
    if (node.isConnected) node.nodeValue = original;
  });
  translated.clear();
  document.documentElement.lang = "en";
  emitStatus("ready");
}

async function translatePage() {
  if (translationInFlight) {
    translationQueued = true;
    return translationInFlight;
  }
  translationInFlight = translatePageInternal(translationGeneration);
  try {
    await translationInFlight;
  } finally {
    translationInFlight = null;
    if (translationQueued) {
      translationQueued = false;
      const match = document.cookie.match(/(?:^|; )trackmcp_locale=([^;]+)/);
      if (match?.[1] === "zh-CN") void translatePage();
    }
  }
}

async function translatePageInternal(generation: number) {
  const records = collectTextNodes();
  if (!records.length) {
    document.documentElement.lang = "zh-CN";
    emitStatus("ready");
    return;
  }

  emitStatus("translating");
  try {
    const uncached = [...new Set(records.map(({ original }) => original))].filter((original) => !translationCache.has(original));
    for (let index = 0; index < uncached.length; index += 80) {
      const batch = uncached.slice(index, index + 80);
      const response = await fetch("/api/translation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts: batch, sourceLocale: "en", targetLocale: "zh-CN" }),
      });
      if (!response.ok) throw new Error("Translation service unavailable.");
      const body = (await response.json()) as { translations?: unknown };
      const translations = Array.isArray(body.translations) ? body.translations : [];
      if (translations.length !== batch.length || translations.some((value) => typeof value !== "string" || !value)) {
        throw new Error("Translation service returned incomplete content.");
      }
      batch.forEach((original, batchIndex) => cacheTranslation(original, translations[batchIndex] as string));
    }
    if (generation !== translationGeneration) return;
    records.forEach(({ node, original }) => {
      const value = translationCache.get(original);
      if (value && node.isConnected) {
        node.nodeValue = value;
        translated.add(node);
      }
    });
    document.documentElement.lang = "zh-CN";
    emitStatus("ready");
  } catch {
    restoreEnglish();
    emitStatus("error");
  }
}

export function TranslationRuntime() {
  useEffect(() => {
    const locale = (): SiteLocale => {
      return readSiteLocale();
    };
    let timer: number | undefined;
    const apply = () => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (locale() === "zh-CN") void translatePage();
        else restoreEnglish();
      }, 0);
    };
    const onLocaleChange = (event: Event) => {
      const next = (event as CustomEvent<{ locale?: SiteLocale }>).detail?.locale;
      translationGeneration += 1;
      if (next === "zh-CN") void translatePage();
      else restoreEnglish();
    };
    const observer = new MutationObserver(() => {
      if (locale() === "zh-CN") apply();
    });
    window.addEventListener("trackmcp:locale-change", onLocaleChange);
    observer.observe(document.body, { childList: true, subtree: true });
    if (locale() === "zh-CN") void translatePage();
    return () => {
      if (timer) window.clearTimeout(timer);
      observer.disconnect();
      window.removeEventListener("trackmcp:locale-change", onLocaleChange);
    };
  }, []);

  return null;
}
