import type { CompletionSource, CorrelationQuality } from "./analytics-types";
import type { TrackMCPSessionIdSource } from "./types";

/**
 * TrackMCP uses the nearest-rank percentile: ceil(n * p), one-indexed, after
 * sorting observed non-negative durations. This keeps the result deterministic
 * for small samples and avoids interpolating a latency we did not observe.
 */
export function percentile(values: readonly number[], percentileValue: number): number | null {
  if (!values.length || !Number.isFinite(percentileValue)) return null;
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const rank = Math.min(sorted.length, Math.max(1, Math.ceil(sorted.length * Math.min(1, Math.max(0, percentileValue)))));
  return sorted[rank - 1];
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

type WorkflowEvent = {
  event_type?: string | null;
  payload?: Record<string, unknown> | null;
  success?: boolean | null;
  is_error?: boolean | null;
};

export function isWorkflowLifecycleEvent(event: WorkflowEvent): boolean {
  return (event.event_type === "workflow" || event.event_type === "custom")
    && event.payload?.name === "workflow"
    && typeof event.payload.workflow_name === "string"
    && typeof event.payload.status === "string";
}

export function completionSourceForEvents(events: readonly WorkflowEvent[]): CompletionSource {
  if (events.some(isWorkflowLifecycleEvent)) return "workflow_events";
  if (events.some((event) => event.event_type === "tool_call")) return "session_heuristic";
  return "none";
}

export function completedForEvents(events: readonly WorkflowEvent[], failedEvent: (event: WorkflowEvent) => boolean): boolean {
  const source = completionSourceForEvents(events);
  if (source === "workflow_events") {
    return events.some((event) => isWorkflowLifecycleEvent(event) && event.payload?.status === "completed");
  }
  if (source !== "session_heuristic") return false;
  const calls = events.filter((event) => event.event_type === "tool_call");
  const last = calls[calls.length - 1];
  return Boolean(last && !failedEvent(last));
}
