export const SUBMISSION_SOURCES = [
  "google",
  "chatgpt",
  "other_website",
  "direct_unknown",
  "unattributed",
] as const;

export type SubmissionSource = (typeof SUBMISSION_SOURCES)[number];

export type SubmissionAttribution = {
  first_touch_source: SubmissionSource;
  last_touch_source: SubmissionSource;
  source_class: SubmissionSource;
  referrer_hostname: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  landing_pathname: string | null;
  submitted_at: string;
  submission_event_id: string;
};

export type SubmissionAttributionInput = {
  first_touch_source?: unknown;
  last_touch_source?: unknown;
  source_class?: unknown;
  referrer_hostname?: unknown;
  utm_source?: unknown;
  utm_medium?: unknown;
  utm_campaign?: unknown;
  landing_pathname?: unknown;
  submitted_at?: unknown;
  submission_event_id?: unknown;
};

const MAX_HOSTNAME = 253;
const MAX_UTM = 128;
const MAX_PATHNAME = 512;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function boundedString(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function source(value: unknown): SubmissionSource | null {
  return typeof value === "string" && (SUBMISSION_SOURCES as readonly string[]).includes(value)
    ? value as SubmissionSource
    : null;
}

export function normalizeReferrerHostname(value: unknown): string | null {
  if (typeof value !== "string" || value.trim().length > MAX_HOSTNAME) return null;
  const raw = boundedString(value, MAX_HOSTNAME);
  if (!raw) return null;
  try {
    const hostname = new URL(raw.includes("://") ? raw : `https://${raw}`).hostname.toLowerCase().replace(/^www\./, "");
    return hostname && hostname.length <= MAX_HOSTNAME ? hostname : null;
  } catch {
    return null;
  }
}

function normalizePathname(value: unknown): string | null {
  const path = boundedString(value, MAX_PATHNAME);
  if (!path || !path.startsWith("/")) return null;
  return path.split(/[?#]/, 1)[0] || "/";
}

function normalizeUtm(value: unknown): string | null {
  return boundedString(value, MAX_UTM);
}

function hostnameIsGoogle(hostname: string): boolean {
  return /(^|\.)google\.[a-z.]+$/i.test(hostname);
}

function hostnameIsChatGPT(hostname: string): boolean {
  return hostname === "chatgpt.com" || hostname === "chat.openai.com";
}

function isOwnHostname(hostname: string): boolean {
  return hostname === "trackmcp.com" || hostname === "app.trackmcp.com" || hostname === "localhost";
}

export function classifySubmissionSource(input: {
  referrerHostname?: unknown;
  utmSource?: unknown;
  captured?: boolean;
}): SubmissionSource {
  const hostname = normalizeReferrerHostname(input.referrerHostname);
  const utm = boundedString(input.utmSource, MAX_UTM)?.toLowerCase() || "";
  if (utm === "google" || (hostname ? hostnameIsGoogle(hostname) : false)) return "google";
  if (utm === "chatgpt" || utm === "openai" || (hostname ? hostnameIsChatGPT(hostname) : false)) return "chatgpt";
  if (hostname && !isOwnHostname(hostname)) return "other_website";
  return input.captured ? "direct_unknown" : "unattributed";
}

export function normalizeSubmissionAttribution(
  input: SubmissionAttributionInput | null | undefined,
  submittedAt: string,
  submissionEventId: string,
): SubmissionAttribution {
  const value = input && typeof input === "object" ? input : {};
  const referrerHostname = normalizeReferrerHostname(value.referrer_hostname);
  const utmSource = normalizeUtm(value.utm_source);
  const utmMedium = normalizeUtm(value.utm_medium);
  const utmCampaign = normalizeUtm(value.utm_campaign);
  const captured = Object.keys(value).length > 0;
  const currentSource = classifySubmissionSource({ referrerHostname, utmSource, captured });
  const first = source(value.first_touch_source) || currentSource;
  const last = source(value.last_touch_source) || currentSource;
  const eventId = UUID_RE.test(submissionEventId) ? submissionEventId.toLowerCase() : crypto.randomUUID();
  return {
    first_touch_source: first,
    last_touch_source: last,
    source_class: last,
    referrer_hostname: referrerHostname,
    utm_source: utmSource,
    utm_medium: utmMedium,
    utm_campaign: utmCampaign,
    landing_pathname: normalizePathname(value.landing_pathname),
    submitted_at: submittedAt,
    submission_event_id: eventId,
  };
}
