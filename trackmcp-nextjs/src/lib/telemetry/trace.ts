import type { TraceResponse } from "./analytics-types.ts";
import { completionSourceForEvents, correlationQualityForEvents } from "./analytics.ts";

export function traceScope(workspaceId: string, sessionId: string) {
  return { workspaceId, sessionId };
}

export function traceResponse(sessionId: string, events: TraceResponse["events"], options: { truncated?: boolean } = {}): TraceResponse {
  return {
    session_id: sessionId,
    correlation_quality: correlationQualityForEvents(events),
    completion_source: completionSourceForEvents(events),
    event_count: events.length,
    truncated: options.truncated === true,
    events,
  };
}
