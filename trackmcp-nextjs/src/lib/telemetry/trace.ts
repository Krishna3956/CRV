import type { TraceResponse } from "./analytics-types.ts";
import { correlationQualityForEvents } from "./analytics.ts";

export function traceScope(workspaceId: string, sessionId: string) {
  return { workspaceId, sessionId };
}

export function traceResponse(sessionId: string, events: TraceResponse["events"]): TraceResponse {
  return { session_id: sessionId, correlation_quality: correlationQualityForEvents(events), events };
}
