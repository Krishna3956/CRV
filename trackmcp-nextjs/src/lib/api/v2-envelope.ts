import { NextResponse } from "next/server.js";

export type TrackMCPV2EvidenceQuality = "observed" | "insufficient_data" | "truncated" | "unknown";

export type TrackMCPV2Envelope = {
  range: { days: number | null; from: string | null; to: string };
  scope: { type: "workspace"; value: "authenticated" };
  generated_at: string;
  freshness: { observed_through: string | null; lag_seconds: number | null };
  source_count: number;
  truncated: boolean;
  evidence_quality: TrackMCPV2EvidenceQuality;
  classifier_version: string;
  caveats: string[];
};

type DataTrust = {
  generated_at?: unknown;
  query_since?: unknown;
  observed_through?: unknown;
  source_event_count?: unknown;
  returned_event_count?: unknown;
  truncated?: unknown;
};

const boundedCaveats = (values: unknown): string[] =>
  Array.isArray(values)
    ? values.filter((value): value is string => typeof value === "string").map((value) => value.slice(0, 500)).slice(0, 12)
    : [];

/**
 * Add the common, machine-readable provenance contract to a v2 projection.
 * This is intentionally additive: existing v2 fields remain unchanged.
 */
export function withTrackMCPV2Envelope<T extends Record<string, unknown>>(
  body: T,
  request: Request,
  options: { caveats?: string[]; classifierVersion?: string } = {},
): T & TrackMCPV2Envelope {
  const trust = body.data_trust && typeof body.data_trust === "object" ? body.data_trust as DataTrust : {};
  const generatedAt = typeof trust.generated_at === "string" ? trust.generated_at : new Date().toISOString();
  const observedThrough = typeof trust.observed_through === "string" ? trust.observed_through : null;
  const sourceCount = typeof trust.source_event_count === "number"
    ? Math.max(0, Math.floor(trust.source_event_count))
    : typeof body.total_events === "number" ? Math.max(0, Math.floor(body.total_events)) : 0;
  const truncated = trust.truncated === true || trust.returned_event_count !== trust.source_event_count && trust.truncated === true;
  const days = typeof body.range_days === "number" && Number.isFinite(body.range_days) ? Math.max(1, Math.floor(body.range_days)) : null;
  const generatedMs = Date.parse(generatedAt);
  const observedMs = observedThrough ? Date.parse(observedThrough) : NaN;
  const lagSeconds = Number.isFinite(generatedMs) && Number.isFinite(observedMs)
    ? Math.max(0, Math.floor((generatedMs - observedMs) / 1000))
    : null;
  const caveats = boundedCaveats(options.caveats ?? body.caveats);
  const evidence_quality: TrackMCPV2EvidenceQuality = truncated
    ? "truncated"
    : sourceCount > 0 ? "observed" : "insufficient_data";
  const rangeFrom = typeof trust.query_since === "string" ? trust.query_since : null;
  const envelope: TrackMCPV2Envelope = {
    range: { days, from: rangeFrom, to: generatedAt },
    scope: { type: "workspace", value: "authenticated" },
    generated_at: generatedAt,
    freshness: { observed_through: observedThrough, lag_seconds: lagSeconds },
    source_count: sourceCount,
    truncated,
    evidence_quality,
    classifier_version: options.classifierVersion ?? "semantic:1",
    caveats,
  };
  // Keep the request parameter in the signature so future scope/filter fields
  // cannot accidentally be inferred from untrusted response data.
  void request;
  return { ...body, ...envelope };
}

export async function envelopeV2Response(response: Response, request: Request, options?: { caveats?: string[]; classifierVersion?: string }) {
  if (!response.ok) return response;
  const body = await response.json() as Record<string, unknown>;
  return NextResponse.json(withTrackMCPV2Envelope(body, request, options));
}
