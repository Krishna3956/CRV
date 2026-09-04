"use client";

import { track } from "@vercel/analytics";

type MarketingValue = string | number | boolean | null | undefined;
export type ContentAttribution = {
  content_path?: string;
  content_cta?: string;
  content_surface?: string;
  captured_at?: string;
};

const ATTRIBUTION_KEY = "trackmcp_content_attribution";

function browserStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function saveContentAttribution(attribution: ContentAttribution) {
  const storage = browserStorage();
  if (!storage || !attribution.content_path) return;
  try {
    storage.setItem(ATTRIBUTION_KEY, JSON.stringify({ ...attribution, captured_at: new Date().toISOString() }));
  } catch {
    // Analytics must never affect the signup path.
  }
}

export function readContentAttribution(): ContentAttribution {
  const storage = browserStorage();
  if (!storage) return {};
  try {
    const value = JSON.parse(storage.getItem(ATTRIBUTION_KEY) || "null") as ContentAttribution | null;
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

export function trackMarketingEvent(name: string, properties: Record<string, MarketingValue> = {}) {
  try {
    track(name, { ...readContentAttribution(), ...properties });
  } catch {
    // Analytics must remain fail-open.
  }
}

export function trackMarketingEventOnce(name: string, properties: Record<string, MarketingValue> = {}) {
  const storage = browserStorage();
  const marker = `${ATTRIBUTION_KEY}:${name}`;
  if (storage) {
    try {
      if (storage.getItem(marker)) return;
      storage.setItem(marker, "1");
    } catch {
      // Continue with the event if storage is unavailable.
    }
  }
  trackMarketingEvent(name, properties);
}

export function contentSurface(pathname: string) {
  if (pathname.startsWith("/blog")) return "blog";
  if (pathname.startsWith("/docs")) return "docs";
  if (pathname.startsWith("/repository") || pathname.startsWith("/tool/")) return "directory";
  return "marketing";
}
