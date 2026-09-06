import type { CorrelationQuality } from "./analytics-types";
import type { TrackMCPSessionIdSource } from "./types";

export function percentile(values: readonly number[], percentileValue: number): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(sorted.length * percentileValue) - 1)];
}

type SessionSourceEvent = {
  session_id?: string | null;
  session_id_source?: TrackMCPSessionIdSource | null;
};

export function correlationQualityForEvents(events: readonly SessionSourceEvent[]): CorrelationQuality {
  if (!events.length) return "missing";
  const qualities = new Set<"session_id" | "transport_generated" | "missing">();
  for (const event of events) {
    const source = event.session_id_source || "missing";
    if (source === "protocol" || source === "external") qualities.add("session_id");
    else if (source === "transport_generated") qualities.add("transport_generated");
    else qualities.add("missing");
  }
  return qualities.size === 1 ? [...qualities][0] : "mixed";
}
