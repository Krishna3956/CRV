import { NextResponse } from "next/server.js";
import { createAnalyticsHandler } from "../../v1/analytics/handlers.ts";
import { withTrackMCPV2Envelope } from "../../../../lib/api/v2-envelope.ts";

export function createTasksHandler(analytics = createAnalyticsHandler()) {
  return async function GET(request: Request) {
    const response = await analytics(request);
    if (!response.ok) return response;
    const body = await response.json() as { range_days?: unknown; founder_os?: { tasks?: unknown }; data_trust?: unknown };
    const tasks = Array.isArray(body.founder_os?.tasks) ? body.founder_os.tasks.slice(0, 100) : [];
    return NextResponse.json(withTrackMCPV2Envelope({
      range_days: typeof body.range_days === "number" ? body.range_days : null,
      tasks,
      task_count: tasks.length,
      data_trust: body.data_trust ?? null,
      caveats: [
        "Tasks are shown only when a bounded task ID was observed in telemetry.",
        "State is the latest explicit task status in the selected window; missing events are not treated as abandonment.",
        "Task completion is protocol evidence and does not prove the customer's business outcome.",
      ],
    }, request));
  };
}

export const GET = createTasksHandler();
