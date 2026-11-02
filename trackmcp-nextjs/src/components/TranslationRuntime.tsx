"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import { readSiteLocale, type SiteLocale } from "./site-locale";

type TextRecord = { kind: "text"; node: Text; original: string };
type AttributeName = "placeholder" | "aria-label" | "title" | "alt";
type AttributeRecord = { kind: "attribute"; element: Element; attribute: AttributeName; original: string };
type TitleRecord = { kind: "document-title"; original: string };
type TranslationRecord = TextRecord | AttributeRecord | TitleRecord;
const TRANSLATABLE_ATTRIBUTES: AttributeName[] = ["placeholder", "aria-label", "title", "alt"];
const OPAQUE_TECHNICAL_LABEL = /^(?:[A-Za-z]+(?:\s+(?:SDK|API|CLI|MCP|HTTP|SSE|OTel|JSON|OAuth|URL|ID)))+$/;
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
let translationObserverSuppressed = false;
let translationObserverDirty = false;
let translationObserverReleaseTimer: number | undefined;
let scheduleTranslationRefresh: (() => void) | null = null;
const TRANSLATION_BATCH_SIZE = 80;
const TRANSLATION_BATCH_MAX_CHARS = 30_000;
const TRANSLATION_REQUEST_TIMEOUT_MS = 12_000;
const TRANSLATION_PAGE_TIMEOUT_MS = 20_000;
let activeTranslationAbortController: AbortController | null = null;

function suppressTranslationObserver() {
  translationObserverSuppressed = true;
  if (translationObserverReleaseTimer !== undefined) {
    window.clearTimeout(translationObserverReleaseTimer);
  }
  translationObserverReleaseTimer = window.setTimeout(() => {
    translationObserverSuppressed = false;
    translationObserverReleaseTimer = undefined;
    if (translationObserverDirty) {
      translationObserverDirty = false;
      scheduleTranslationRefresh?.();
    }
  }, 0);
}

function translationEndpoints(): string[] {
  const endpoints = ["/api/translation"];
  const origin = process.env.NEXT_PUBLIC_TRANSLATION_ORIGIN?.replace(/\/+$/, "");
  if (origin && typeof window !== "undefined" && origin !== window.location.origin) {
    endpoints.push(`${origin}/api/translation`);
  }
  return endpoints;
}

type TranslationRequestError = Error & { status?: number };

async function requestTranslation(batch: string[], signal: AbortSignal): Promise<string[]> {
  let lastError: TranslationRequestError | null = null;
  for (const endpoint of translationEndpoints()) {
    if (signal.aborted) throw new DOMException("Translation cancelled.", "AbortError");
    const controller = new AbortController();
    const onAbort = () => controller.abort();
    const timeout = window.setTimeout(() => controller.abort(), TRANSLATION_REQUEST_TIMEOUT_MS);
    signal.addEventListener("abort", onAbort, { once: true });
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts: batch, sourceLocale: "en", targetLocale: "zh-CN" }),
        signal: controller.signal,
      });
      if (!response.ok) {
        lastError = Object.assign(new Error(`Translation service returned ${response.status}.`), { status: response.status });
        continue;
      }
      const body = (await response.json()) as { translations?: unknown };
      const translations = Array.isArray(body.translations) ? body.translations : [];
      if (translations.length !== batch.length || translations.some((value) => typeof value !== "string" || !value)) {
        lastError = new Error("Translation service returned incomplete content.");
        continue;
      }
      return translations as string[];
    } catch (error) {
      if (signal.aborted) throw new DOMException("Translation cancelled.", "AbortError");
      lastError = Object.assign(
        error instanceof Error ? error : new Error("Translation service unavailable."),
        { status: 503 },
      );
    } finally {
      window.clearTimeout(timeout);
      signal.removeEventListener("abort", onAbort);
    }
  }
  throw lastError || new Error("Translation service unavailable.");
}

async function requestTranslationBestEffort(batch: string[], signal: AbortSignal): Promise<Array<string | null>> {
  try {
    return await requestTranslation(batch, signal);
  } catch (error) {
    if (signal.aborted) throw error;
    const status = typeof error === "object" && error !== null && "status" in error
      ? Number((error as TranslationRequestError).status)
      : undefined;
    if (status === 408 || status === 429 || (status !== undefined && status >= 500)) {
      return batch.map(() => null);
    }
    // A single provider-rejected label must not discard an entire page. Split
    // the batch until the valid prose can be translated and leave only an
    // individual unsupported token in its source language.
    if (batch.length === 1) return [null];
    const midpoint = Math.ceil(batch.length / 2);
    const left = await requestTranslationBestEffort(batch.slice(0, midpoint), signal);
    const right = await requestTranslationBestEffort(batch.slice(midpoint), signal);
    return [...left, ...right];
  }
}

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
  if (text.length < 2 || text.length > 4_000 || /^https?:\/\//i.test(text) || /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(text) || OPAQUE_TECHNICAL_LABEL.test(text) || /^[-_./:@#$%{}[\]()<>=+*|\\\d\s]+$/.test(text)) return true;
  return false;
}

function isExcludedElement(element: Element): boolean {
  // Form controls are excluded from text-node translation, but their
  // user-facing placeholder and aria-label attributes are still translatable.
  return Boolean(element.closest("[data-no-translate], script, style, noscript, pre, code, svg, [contenteditable='true'], [aria-hidden='true']"));
}

function isTranslatableValue(value: string): boolean {
  const text = value.trim();
  return text.length >= 2 && text.length <= 4_000 && !/^https?:\/\//i.test(text) && !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(text) && !OPAQUE_TECHNICAL_LABEL.test(text) && !/^[-_./:@#$%{}[\]()<>=+*|\\\d\s]+$/.test(text);
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

function setInitialTranslationPending(pending: boolean) {
  if (pending) document.documentElement.setAttribute("data-trackmcp-translation-pending", "true");
  else document.documentElement.removeAttribute("data-trackmcp-translation-pending");
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
  setInitialTranslationPending(false);
  document.documentElement.lang = "en";
  emitStatus("ready");
}

async function translatePage() {
  if (translationInFlight) {
    translationQueued = true;
    return translationInFlight;
  }
  const controller = new AbortController();
  activeTranslationAbortController = controller;
  translationInFlight = translatePageInternal(translationGeneration, controller);
  try {
    await translationInFlight;
  } finally {
    if (activeTranslationAbortController === controller) activeTranslationAbortController = null;
    translationInFlight = null;
    if (translationQueued) {
      translationQueued = false;
      const match = document.cookie.match(/(?:^|; )trackmcp_locale=([^;]+)/);
      if (match?.[1] === "zh-CN") void translatePage();
    }
  }
}

async function translatePageInternal(generation: number, controller: AbortController) {
  const initialTranslation = document.documentElement.getAttribute("data-trackmcp-translation-pending") === "true";
  if (!initialTranslation) setInitialTranslationPending(false);
  const pageTimeout = window.setTimeout(() => controller.abort("timeout"), TRANSLATION_PAGE_TIMEOUT_MS);
  const records = collectTranslationRecords();
  if (!records.length) {
    window.clearTimeout(pageTimeout);
    setInitialTranslationPending(false);
    document.documentElement.lang = "zh-CN";
    emitStatus("ready");
    return;
  }

  emitStatus("translating");
  try {
    const uncached = [...new Set(records.map(({ original }) => original))].filter((original) => !translationCache.has(original));
    let batch: string[] = [];
    let batchChars = 0;
    const batches: string[][] = [];
    for (const original of uncached) {
      if (batch.length && (batch.length >= TRANSLATION_BATCH_SIZE || batchChars + original.length > TRANSLATION_BATCH_MAX_CHARS)) {
        batches.push(batch);
        batch = [];
        batchChars = 0;
      }
      batch.push(original);
      batchChars += original.length;
    }
    if (batch.length) batches.push(batch);
    for (const batch of batches) {
      const translations = await requestTranslationBestEffort(batch, controller.signal);
      batch.forEach((original, batchIndex) => {
        const value = translations[batchIndex];
        if (value) cacheTranslation(original, value);
      });
    }
    if (generation !== translationGeneration) return;
    // Applying translated text mutates the same DOM observed below. Suppress
    // that callback batch so the runtime does not immediately queue a second
    // pass and visibly churn the page. A real page mutation in the same task
    // marks the observer dirty and is rechecked after this write batch settles.
    suppressTranslationObserver();
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
    setInitialTranslationPending(false);
    document.documentElement.lang = "zh-CN";
    emitStatus("ready");
  } catch {
    if (controller.signal.aborted && controller.signal.reason === "route-change") return;
    window.clearTimeout(pageTimeout);
    restoreEnglish();
    emitStatus("error");
  } finally {
    window.clearTimeout(pageTimeout);
  }
}

export function TranslationRuntime() {
  const pathname = usePathname();

  useLayoutEffect(() => {
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
      else {
        activeTranslationAbortController?.abort("locale-change");
        restoreEnglish();
      }
    };
    const observer = new MutationObserver(() => {
      if (translationObserverSuppressed) {
        translationObserverDirty = true;
        return;
      }
      if (locale() === "zh-CN") apply();
    });
    scheduleTranslationRefresh = apply;
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
      translationGeneration += 1;
      activeTranslationAbortController?.abort("route-change");
      if (timer) window.clearTimeout(timer);
      observer.disconnect();
      window.removeEventListener("trackmcp:locale-change", onLocaleChange);
      scheduleTranslationRefresh = null;
      translationObserverDirty = false;
      if (translationObserverReleaseTimer !== undefined) {
        window.clearTimeout(translationObserverReleaseTimer);
        translationObserverReleaseTimer = undefined;
      }
      translationObserverSuppressed = false;
    };
  }, [pathname]);

  return null;
}
