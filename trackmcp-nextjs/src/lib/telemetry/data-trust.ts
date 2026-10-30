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
  observation_recency: TrackMCPObservationRecency;
};

export const TRACKMCP_OBSERVATION_STALE_AFTER_MS = 86_400_000;

export type TrackMCPObservationRecency = {
  status: "recent" | "stale" | "no_observation" | "unknown";
  observed_at: string | null;
  age_ms: number | null;
  stale_after_ms: number;
  limitation: "evidence_recency_only_not_service_health";
};

function observationRecency(generatedAt: unknown, observedThrough: unknown): TrackMCPObservationRecency {
  const observed_at = typeof observedThrough === "string" && observedThrough.length <= 80 ? observedThrough : null;
  if (!observed_at) {
    return { status: "no_observation", observed_at: null, age_ms: null, stale_after_ms: TRACKMCP_OBSERVATION_STALE_AFTER_MS, limitation: "evidence_recency_only_not_service_health" };
  }
  const generatedMs = typeof generatedAt === "string" ? Date.parse(generatedAt) : Number.NaN;
  const observedMs = Date.parse(observed_at);
  if (!Number.isFinite(generatedMs) || !Number.isFinite(observedMs)) {
    return { status: "unknown", observed_at, age_ms: null, stale_after_ms: TRACKMCP_OBSERVATION_STALE_AFTER_MS, limitation: "evidence_recency_only_not_service_health" };
  }
  const age_ms = Math.max(0, Math.min(315_360_000_000, Math.floor(generatedMs - observedMs)));
  return {
    status: age_ms > TRACKMCP_OBSERVATION_STALE_AFTER_MS ? "stale" : "recent",
    observed_at,
    age_ms,
    stale_after_ms: TRACKMCP_OBSERVATION_STALE_AFTER_MS,
    limitation: "evidence_recency_only_not_service_health",
  };
}

/** Project untrusted read-model provenance into the public contract. */
export function projectTrackMCPDataTrust(value: unknown): TrackMCPDataTrust | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  const text = (candidate: unknown) => typeof candidate === "string" ? candidate.slice(0, 80) : "";
  const count = (candidate: unknown) => typeof candidate === "number" && Number.isSafeInteger(candidate) ? Math.max(0, Math.min(1000000, candidate)) : 0;
  const recency = row.observation_recency && typeof row.observation_recency === "object" && !Array.isArray(row.observation_recency)
    ? row.observation_recency as Record<string, unknown>
    : null;
  const recencyStatus = recency?.status;
  const projectedRecency: TrackMCPObservationRecency = recency && (recencyStatus === "recent" || recencyStatus === "stale" || recencyStatus === "no_observation" || recencyStatus === "unknown")
    ? {
      status: recencyStatus,
      observed_at: typeof recency.observed_at === "string" ? recency.observed_at.slice(0, 80) : null,
      age_ms: typeof recency.age_ms === "number" && Number.isSafeInteger(recency.age_ms) ? Math.max(0, Math.min(315_360_000_000, recency.age_ms)) : null,
      stale_after_ms: TRACKMCP_OBSERVATION_STALE_AFTER_MS,
      limitation: "evidence_recency_only_not_service_health" as const,
    }
    : observationRecency(row.generated_at, row.observed_through);
  return {
    generated_at: text(row.generated_at),
    query_since: text(row.query_since),
    query_until: text(row.query_until),
    source_event_count: count(row.source_event_count),
    returned_event_count: count(row.returned_event_count),
    truncated: row.truncated === true,
    observed_through: typeof row.observed_through === "string" ? row.observed_through.slice(0, 80) : null,
    observation_recency: projectedRecency,
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
    observation_recency: observationRecency(input.generatedAt, input.observedThrough),
  };
}
