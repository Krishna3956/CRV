/**
 * Query provenance for dashboard/read-model responses. This is deliberately
 * a pure projection: it describes the bounded scan that produced a response,
 * not the completeness of telemetry outside that scan.
 */
export type TrackMCPDataTrust = {
  generated_at: string;
  query_since: string;
  query_until: string;
  source_event_count: number;
  returned_event_count: number;
  truncated: boolean;
  observed_through: string | null;
};

/** Project untrusted read-model provenance into the public contract. */
export function projectTrackMCPDataTrust(value: unknown): TrackMCPDataTrust | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  const text = (candidate: unknown) => typeof candidate === "string" ? candidate.slice(0, 80) : "";
  const count = (candidate: unknown) => typeof candidate === "number" && Number.isSafeInteger(candidate) ? Math.max(0, Math.min(1000000, candidate)) : 0;
  return {
    generated_at: text(row.generated_at),
    query_since: text(row.query_since),
    query_until: text(row.query_until),
    source_event_count: count(row.source_event_count),
    returned_event_count: count(row.returned_event_count),
    truncated: row.truncated === true,
    observed_through: typeof row.observed_through === "string" ? row.observed_through.slice(0, 80) : null,
  };
}

export function buildTrackMCPDataTrust(input: {
  generatedAt: string;
  querySince: string;
  sourceEventCount: number;
  returnedEventCount: number;
  queryLimit: number;
  observedThrough: string | null;
}): TrackMCPDataTrust {
  const source_event_count = Math.max(0, Math.floor(input.sourceEventCount));
  const returned_event_count = Math.max(0, Math.floor(input.returnedEventCount));
  const queryLimit = Math.max(1, Math.floor(input.queryLimit));
  return {
    generated_at: input.generatedAt,
    query_since: input.querySince,
    query_until: input.generatedAt,
    source_event_count,
    returned_event_count,
    truncated: returned_event_count >= queryLimit,
    observed_through: input.observedThrough,
  };
}
