"use client";

import { track } from "@vercel/analytics";
import posthog from "posthog-js";
import {
  classifySubmissionSource,
  normalizeReferrerHostname,
  type SubmissionSource,
} from "./submission-attribution";

type MarketingValue = string | number | boolean | null | undefined;
export type ContentAttribution = {
  content_path?: string;
  content_cta?: string;
  content_surface?: string;
  captured_at?: string;
};

const ATTRIBUTION_KEY = "trackmcp_content_attribution";
const SUBMISSION_ATTRIBUTION_KEY = "trackmcp_submission_attribution";

export type SubmissionAttributionSnapshot = {
  first_touch_source: SubmissionSource;
  last_touch_source: SubmissionSource;
  referrer_hostname: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  landing_pathname: string;
};

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
    const eventProperties = { ...readContentAttribution(), ...properties };
    track(name, eventProperties);
    posthog.capture(name, eventProperties);
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

function readSubmissionStorage(): Partial<SubmissionAttributionSnapshot> {
  const storage = browserStorage();
  if (!storage) return {};
  try {
    const value = JSON.parse(storage.getItem(SUBMISSION_ATTRIBUTION_KEY) || "null");
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

/** Capture bounded first/last-touch context in first-party local storage only. */
export function captureSubmissionAttribution(): SubmissionAttributionSnapshot | null {
  if (typeof window === "undefined") return null;
  const storage = browserStorage();
  const currentUrl = new URL(window.location.href);
  const referrerHostname = normalizeReferrerHostname(document.referrer);
  const utmSource = currentUrl.searchParams.get("utm_source")?.slice(0, 128) || null;
  const utmMedium = currentUrl.searchParams.get("utm_medium")?.slice(0, 128) || null;
  const utmCampaign = currentUrl.searchParams.get("utm_campaign")?.slice(0, 128) || null;
  const previous = readSubmissionStorage();
  const currentSource = classifySubmissionSource({ referrerHostname, utmSource, captured: true });
  const hasSourceSignal = Boolean(utmSource || (referrerHostname && currentSource !== "direct_unknown"));
  const snapshot: SubmissionAttributionSnapshot = {
    first_touch_source: previous.first_touch_source || currentSource,
    last_touch_source: hasSourceSignal ? currentSource : previous.last_touch_source || currentSource,
    referrer_hostname: referrerHostname || previous.referrer_hostname || null,
    utm_source: utmSource || previous.utm_source || null,
    utm_medium: utmMedium || previous.utm_medium || null,
    utm_campaign: utmCampaign || previous.utm_campaign || null,
    landing_pathname: previous.landing_pathname || currentUrl.pathname || "/",
  };
  if (storage) {
    try {
      storage.setItem(SUBMISSION_ATTRIBUTION_KEY, JSON.stringify(snapshot));
    } catch {
      // Analytics must never affect the submission path.
    }
  }
  return snapshot;
}

export function readSubmissionAttribution(): SubmissionAttributionSnapshot | null {
  const value = readSubmissionStorage();
  return value.first_touch_source && value.last_touch_source && value.landing_pathname
    ? value as SubmissionAttributionSnapshot
    : null;
}

export function contentSurface(pathname: string) {
  if (pathname.startsWith("/blog")) return "blog";
  if (pathname.startsWith("/docs")) return "docs";
  if (pathname.startsWith("/repository") || pathname.startsWith("/tool/")) return "directory";
  return "marketing";
}
