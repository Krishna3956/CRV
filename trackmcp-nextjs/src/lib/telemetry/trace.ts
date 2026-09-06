import type { TraceResponse } from "./analytics-types.ts";
import { completionSourceForEvents, correlationQualityForEvents } from "./analytics.ts";
import type { TrackMCPCorrelationHandleSource } from "./types.ts";

export function traceScope(workspaceId: string, sessionId: string) {
  return { workspaceId, sessionId };
}

export function traceResponse(sessionId: string | null, events: TraceResponse["events"], options: { truncated?: boolean; correlationHandle?: string | null } = {}): TraceResponse {
  const handles = [...new Set(events.map((event) => event.correlation_handle).filter((handle): handle is string => Boolean(handle)))];
  const sources = [...new Set(events.map((event) => event.correlation_handle_source).filter((source): source is TrackMCPCorrelationHandleSource => Boolean(source)))];
  return {
    session_id: sessionId,
    correlation_handle: options.correlationHandle ?? (handles.length === 1 ? handles[0] : null),
    correlation_handle_source: sources.length === 1 ? sources[0] : null,
    correlation_quality: correlationQualityForEvents(events),
    completion_source: completionSourceForEvents(events),
    event_count: events.length,
    truncated: options.truncated === true,
    events,
  };
}
