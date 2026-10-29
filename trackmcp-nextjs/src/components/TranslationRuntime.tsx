"use client";

import { useEffect } from "react";
import { readSiteLocale, type SiteLocale } from "./site-locale";

type TextRecord = { kind: "text"; node: Text; original: string };
type AttributeName = "placeholder" | "aria-label" | "title" | "alt";
type AttributeRecord = { kind: "attribute"; element: Element; attribute: AttributeName; original: string };
type TitleRecord = { kind: "document-title"; original: string };
type TranslationRecord = TextRecord | AttributeRecord | TitleRecord;
const TRANSLATABLE_ATTRIBUTES: AttributeName[] = ["placeholder", "aria-label", "title", "alt"];
const originals = new Map<Text, string>();
const translated = new Set<Text>();
const attributeOriginals = new Map<Element, Map<AttributeName, string>>();
const translatedAttributes = new Map<Element, Set<AttributeName>>();
let documentTitleOriginal: string | null = null;
let documentTitleTranslated = false;
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

function isExcludedElement(element: Element): boolean {
  // Form controls are excluded from text-node translation, but their
  // user-facing placeholder and aria-label attributes are still translatable.
  return Boolean(element.closest("[data-no-translate], script, style, noscript, pre, code, svg, [contenteditable='true'], [aria-hidden='true']"));
}

function isTranslatableValue(value: string): boolean {
  const text = value.trim();
  return text.length >= 2 && !/^https?:\/\//i.test(text) && !/^[-_./:@#$%{}[\]()<>=+*|\\\d\s]+$/.test(text);
}

function pruneDisconnectedRecords() {
  originals.forEach((_original, node) => {
    if (!node.isConnected) {
      originals.delete(node);
      translated.delete(node);
    }
  });
  attributeOriginals.forEach((_attributes, element) => {
    if (!element.isConnected) {
      attributeOriginals.delete(element);
      translatedAttributes.delete(element);
    }
  });
}

function collectTranslationRecords(): TranslationRecord[] {
  const records: TranslationRecord[] = [];
  pruneDisconnectedRecords();
  if (isTranslatableValue(document.title)) {
    if (documentTitleTranslated) {
      const applied = documentTitleOriginal ? translationCache.get(documentTitleOriginal) : undefined;
      if (applied && document.title === applied) {
        // The title is already translated for the current source value.
      } else {
        documentTitleTranslated = false;
        documentTitleOriginal = document.title;
      }
    } else if (documentTitleOriginal !== document.title) {
      documentTitleOriginal = document.title;
    }
    if (!documentTitleTranslated && documentTitleOriginal) {
      records.push({ kind: "document-title", original: documentTitleOriginal });
    }
  }
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const textNode = node as Text;
    if (isExcluded(textNode)) continue;
    let original = originals.get(textNode) || textNode.nodeValue || "";
    if (translated.has(textNode)) {
      // React may update an existing text node in place rather than replacing
      // it. If its value is no longer the translation we applied, treat the
      // new value as English source text and send it through the next batch.
      const applied = translationCache.get(original);
      if (applied && textNode.nodeValue === applied) continue;
      translated.delete(textNode);
      original = textNode.nodeValue || "";
    }
    if (!original.trim()) continue;
    originals.set(textNode, original);
    records.push({ kind: "text", node: textNode, original });
  }

  const elements = document.querySelectorAll("[placeholder], [aria-label], [title], img[alt]");
  elements.forEach((element) => {
    if (isExcludedElement(element)) return;
    for (const attribute of TRANSLATABLE_ATTRIBUTES) {
      const current = element.getAttribute(attribute);
      if (current === null || !isTranslatableValue(current)) continue;
      const perElement = attributeOriginals.get(element) || new Map<AttributeName, string>();
      let original = perElement.get(attribute) || current;
      const translatedSet = translatedAttributes.get(element);
      if (translatedSet?.has(attribute)) {
        const applied = translationCache.get(original);
        if (applied && current === applied) continue;
        translatedSet.delete(attribute);
        original = current;
      }
      perElement.set(attribute, original);
      attributeOriginals.set(element, perElement);
      records.push({ kind: "attribute", element, attribute, original });
    }
  });
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
  attributeOriginals.forEach((attributes, element) => {
    if (!element.isConnected) return;
    attributes.forEach((original, attribute) => element.setAttribute(attribute, original));
  });
  translatedAttributes.clear();
  if (documentTitleOriginal !== null) document.title = documentTitleOriginal;
  documentTitleTranslated = false;
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
  const records = collectTranslationRecords();
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
    records.forEach((record) => {
      const { original } = record;
      const value = translationCache.get(original);
      if (!value) return;
      if (record.kind === "text" && record.node.isConnected) {
        record.node.nodeValue = value;
        translated.add(record.node);
      } else if (record.kind === "attribute" && record.element.isConnected) {
        record.element.setAttribute(record.attribute, value);
        const translatedSet = translatedAttributes.get(record.element) || new Set<AttributeName>();
        translatedSet.add(record.attribute);
        translatedAttributes.set(record.element, translatedSet);
      } else if (record.kind === "document-title") {
        document.title = value;
        documentTitleTranslated = true;
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
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: TRANSLATABLE_ATTRIBUTES,
      characterData: true,
      childList: true,
      subtree: true,
    });
    if (locale() === "zh-CN") void translatePage();
    return () => {
      if (timer) window.clearTimeout(timer);
      observer.disconnect();
      window.removeEventListener("trackmcp:locale-change", onLocaleChange);
    };
  }, []);

  return null;
}
