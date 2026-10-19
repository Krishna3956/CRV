import { NextResponse } from "next/server.js";
import { createActionQueueHandlers } from "../../v1/action-queue/handlers.ts";
import { withTrackMCPV2Envelope } from "../../../../lib/api/v2-envelope.ts";

const MAX_ITEMS = 100;

/** Versioned, read-only action queue projection. Human mutations stay on v1 PATCH. */
export function createVersionedActionQueueHandler(readQueue = createActionQueueHandlers().GET) {
  return async function GET(request: Request) {
    const url = new URL(request.url);
    url.searchParams.set("include_alerts", "true");
    const response = await readQueue(new Request(url, { method: request.method, headers: request.headers }));
    if (!response.ok) return response;
    const body = await response.json() as { data?: unknown; next_cursor?: unknown; limit?: unknown };
    return NextResponse.json(withTrackMCPV2Envelope({
      data: Array.isArray(body.data) ? body.data.slice(0, MAX_ITEMS) : [],
      next_cursor: body.next_cursor ?? null,
      limit: typeof body.limit === "number" ? Math.min(MAX_ITEMS, body.limit) : MAX_ITEMS,
      // Queue rows are not telemetry events. Use the bounded returned row
      // count as the evidence denominator and leave observed_through null;
      // the envelope must not imply a telemetry freshness watermark here.
      total_events: Array.isArray(body.data) ? Math.min(body.data.length, MAX_ITEMS) : 0,
      api_version: "v2",
    }, request, { caveats: ["Action Queue rows are bounded to the authenticated workspace.", "Queue freshness is not a telemetry watermark; rows reflect the current bounded read projection."] }));
  };
}

export const GET = createVersionedActionQueueHandler();
