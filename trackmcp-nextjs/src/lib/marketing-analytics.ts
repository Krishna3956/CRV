"use client";

import { track } from "@vercel/analytics";
import posthog from "posthog-js";
import {
  classifySubmissionSource,
  normalizeReferrerHostname,
  type SubmissionSource,
} from "./submission-attribution";

type MarketingValue = string | number | boolean | null | undefined;
export const SERVER_ACTIVATION_EVENT_TYPES = new Set([
  "signup_completed",
  "workspace_created",
  "api_key_created",
  "api_key_copied",
  "setup_snippet_copied",
  "first_event_check_started",
  "first_event_check_result",
  "first_telemetry_seen",
] as const);
// Analytics-only events intentionally stay out of the authenticated funnel
// ledger: docs views/CTAs, auth starts, copy failures, and CLI device lifecycle
// events are operational or anonymous product signals rather than activation
// facts accepted by the server contract.
const SERVER_ACTIVATION_SOURCES = new Set(["npm", "sdk_docs", "github", "ai", "direct", "device", "unknown"]);
const SERVER_RESULT_CATEGORIES = new Set(["event_found", "no_event", "unauthorized", "permission_denied", "retryable_error", "unknown"]);
const ACTIVATION_EVENT_PROPERTIES: Record<string, readonly string[]> = {
  sdk_docs_viewed: ["path", "source"],
  signup_cta_clicked: ["source", "content_path", "content_cta"],
  signup_request_started: ["auth_mode"],
  signup_completed: ["auth_mode"],
  workspace_created: [],
  api_key_created: ["key_name_category"],
  api_key_copied: ["copy_method"],
  api_key_copy_failed: ["copy_method"],
  install_command_copied: ["language", "package"],
  setup_snippet_copied: ["language", "package"],
  first_event_check_started: ["data_mode"],
  first_event_check_result: ["result"],
  first_telemetry_seen: ["event_count"],
  cli_device_auth_approved: ["client_version"],
  cli_device_auth_attempted: ["client_version"],
  cli_device_auth_denied: ["client_version", "reason_category"],
  cli_device_auth_expired: ["client_version"],
  cli_device_auth_already_approved: ["client_version"],
  cli_device_auth_already_redeemed: ["client_version"],
  cli_device_auth_invalid: ["client_version"],
  cli_device_auth_unauthenticated: ["client_version"],
  cli_device_auth_unavailable: ["client_version"],
};
export type ContentAttribution = {
  content_path?: string;
  content_cta?: string;
  content_surface?: string;
  package_name?: string;
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
  const contentPath = safeContentPath(attribution.content_path);
  if (!storage || !contentPath) return;
  try {
    storage.setItem(ATTRIBUTION_KEY, JSON.stringify({
      content_path: contentPath,
      content_cta: typeof attribution.content_cta === "string" ? attribution.content_cta.slice(0, 128) : undefined,
      content_surface: typeof attribution.content_surface === "string" ? attribution.content_surface.slice(0, 64) : undefined,
      package_name: safePackageName(attribution.package_name),
      captured_at: new Date().toISOString(),
    }));
  } catch {
    // Analytics must never affect the signup path.
  }
}

export function readContentAttribution(): ContentAttribution {
  const storage = browserStorage();
  if (!storage) return {};
  try {
    const value = JSON.parse(storage.getItem(ATTRIBUTION_KEY) || "null") as ContentAttribution | null;
    if (!value || typeof value !== "object") return {};
    return {
      content_path: safeContentPath(value.content_path) || undefined,
      content_cta: typeof value.content_cta === "string" ? value.content_cta.slice(0, 128) : undefined,
      content_surface: typeof value.content_surface === "string" ? value.content_surface.slice(0, 64) : undefined,
      package_name: safePackageName(value.package_name) || undefined,
      captured_at: typeof value.captured_at === "string" ? value.captured_at.slice(0, 64) : undefined,
    };
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

/** Emit only the bounded, non-secret browser activation contract from the PRD. */
export function trackActivationEvent(
  name: keyof typeof ACTIVATION_EVENT_PROPERTIES,
  properties: Record<string, MarketingValue> = {},
) {
  const allowed = new Set(ACTIVATION_EVENT_PROPERTIES[name]);
  const bounded = Object.fromEntries(
    Object.entries(properties)
      .filter(([key]) => allowed.has(key))
      .map(([key, value]) => [
        key,
        typeof value === "string" ? value.slice(0, 128) : value,
      ]),
  );
  trackMarketingEvent(name, bounded);
  if (SERVER_ACTIVATION_EVENT_TYPES.has(name as typeof SERVER_ACTIVATION_EVENT_TYPES extends Set<infer Event> ? Event : never)) {
    void recordServerActivationEvent(name, properties);
  }
}

function activationEventId() {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
    if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    }
  } catch {
    // Fall through to a bounded non-secret fallback.
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 18)}`;
}

function safeContentPath(value: unknown) {
  if (typeof value !== "string") return null;
  const path = value.trim().split(/[?#]/, 1)[0];
  return path.startsWith("/") && !path.startsWith("//") ? path.slice(0, 256) : null;
}

function safePackageName(value: unknown) {
  if (typeof value !== "string") return null;
  const packageName = value.trim().slice(0, 128);
  return /^@?[A-Za-z0-9._/-]+$/.test(packageName) ? packageName : null;
}

function activationSource(snapshot: SubmissionAttributionSnapshot | null, contentPath: string | null) {
  const utmSource = snapshot?.utm_source?.trim().toLowerCase();
  if (utmSource && SERVER_ACTIVATION_SOURCES.has(utmSource)) return utmSource;
  if (contentPath?.startsWith("/docs")) return "sdk_docs";
  const referrer = snapshot?.referrer_hostname?.toLowerCase() || "";
  if (referrer === "github.com" || referrer.endsWith(".github.com")) return "github";
  if (referrer.includes("chatgpt") || referrer.includes("openai")) return "ai";
  if (snapshot?.last_touch_source === "direct_unknown") return "direct";
  return "unknown";
}

/**
 * Persist only the backend activation contract. This is deliberately
 * fire-and-forget: an unavailable analytics endpoint must never block auth,
 * key creation, clipboard, or first-event verification.
 */
function recordServerActivationEvent(
  name: string,
  properties: Record<string, MarketingValue>,
) {
  if (typeof window === "undefined" || !SERVER_ACTIVATION_EVENT_TYPES.has(name as never)) return;
  const contentAttribution = readContentAttribution();
  const submissionAttribution = captureSubmissionAttribution();
  const contentPath = safeContentPath(contentAttribution.content_path);
  const result = typeof properties.result === "string" && SERVER_RESULT_CATEGORIES.has(properties.result)
    ? properties.result
    : name === "first_event_check_result" ? "unknown" : undefined;
  const packageName = safePackageName(properties.package) || safePackageName(contentAttribution.package_name) || undefined;
  const body = {
    event_id: activationEventId(),
    event_type: name,
    source: activationSource(submissionAttribution, contentPath),
    package_name: packageName,
    content_path: contentPath,
    result_category: result,
  };
  void fetch("/api/v1/activation/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {
    // Analytics must remain fail-open.
  });
}

function attributionProperties(snapshot: SubmissionAttributionSnapshot | null) {
  if (!snapshot) return {};
  return {
    first_touch_source: snapshot.first_touch_source,
    last_touch_source: snapshot.last_touch_source,
    referrer_hostname: snapshot.referrer_hostname,
    utm_source: snapshot.utm_source,
    utm_medium: snapshot.utm_medium,
    utm_campaign: snapshot.utm_campaign,
    landing_pathname: snapshot.landing_pathname,
  } satisfies Record<string, MarketingValue>;
}

/** Identify an authenticated user without sending email or other direct identifiers. */
export function identifyMarketingUser(userId: string, properties: Record<string, MarketingValue> = {}) {
  if (!userId) return;
  try {
    const snapshot = captureSubmissionAttribution();
    const identityProperties = { ...attributionProperties(snapshot), ...properties };
    posthog.identify(userId, identityProperties);
    posthog.register(attributionProperties(snapshot));
  } catch {
    // Analytics must remain fail-open.
  }
}

export function marketingAttributionProperties(snapshot: SubmissionAttributionSnapshot | null) {
  return attributionProperties(snapshot);
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
