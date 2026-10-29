export const SUBMISSION_SOURCES = [
  "google",
  "chatgpt",
  "other_website",
  "direct_unknown",
  "unattributed",
] as const;

export const SELF_REPORTED_SOURCES = [
  "google",
  "chatgpt",
  "github",
  "social_media",
  "community",
  "email_newsletter",
  "friend_or_colleague",
  "other",
] as const;

export type SelfReportedSource = (typeof SELF_REPORTED_SOURCES)[number];

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
  self_reported_source: SelfReportedSource | null;
  self_reported_detail: string | null;
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
  self_reported_source?: unknown;
  self_reported_detail?: unknown;
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

function selfReportedSource(value: unknown): SelfReportedSource | null {
  return typeof value === "string" && (SELF_REPORTED_SOURCES as readonly string[]).includes(value)
    ? value as SelfReportedSource
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

const SENSITIVE_DETAIL_RE = [
  /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/,
  /(?:bearer|password|passwd|secret|api[ _-]?key|access[ _-]?token|refresh[ _-]?token|authorization)\s*[:=]/i,
  /\b(?:sk|pk|key|token)[-_][A-Za-z0-9_-]{12,}\b/i,
  /-----BEGIN [A-Z ]+ KEY-----/i,
];

function normalizeSelfReportedDetail(value: unknown): string | null {
  const detail = boundedString(value, 128);
  if (!detail || SENSITIVE_DETAIL_RE.some((pattern) => pattern.test(detail))) return null;
  return detail;
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
  // Any explicit non-empty campaign source is a known acquisition signal,
  // even when it is not one of the specially grouped sources above (for
  // example Brevo, LinkedIn, or a partner campaign).
  if (utm) return "other_website";
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
  const reportedSource = selfReportedSource(value.self_reported_source);
  const reportedDetail = normalizeSelfReportedDetail(value.self_reported_detail);
  const captured = Object.keys(value).length > 0;
  const currentSource = classifySubmissionSource({ referrerHostname, utmSource, captured });
  const suppliedFirst = source(value.first_touch_source);
  const suppliedLast = source(value.last_touch_source);
  // UTM/referrer signals observed on the submission request are authoritative
  // over stale client storage. A browser can carry an old direct/unknown value
  // in localStorage while arriving on a newly tagged campaign URL; trusting
  // that stale value makes campaign traffic look direct in reporting.
  const hasCurrentSourceSignal = Boolean(utmSource || (referrerHostname && currentSource !== "direct_unknown"));
  // Preserve a valid first-touch value; only the current/last-touch source is
  // overridden by a signal observed on this request.
  const first = suppliedFirst || currentSource;
  const last = hasCurrentSourceSignal ? currentSource : suppliedLast || currentSource;
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
    self_reported_source: reportedSource,
    self_reported_detail: reportedDetail,
    submitted_at: submittedAt,
    submission_event_id: eventId,
  };
}
