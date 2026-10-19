import { NextResponse } from "next/server.js";
import { createAnalyticsHandler } from "../../v1/analytics/handlers.ts";
import { withTrackMCPV2Envelope } from "../../../../lib/api/v2-envelope.ts";

export function createResourcesHandler(analytics = createAnalyticsHandler()) {
  return async function GET(request: Request) {
    const response = await analytics(request);
    if (!response.ok) return response;
    const body = await response.json() as { range_days?: unknown; interaction_surfaces?: { resources?: unknown }; data_trust?: unknown };
    const observed = body.interaction_surfaces?.resources ?? { events: 0, methods: [], entity_analytics: { status: "schema_unavailable" } };
    return NextResponse.json(withTrackMCPV2Envelope({
      range_days: typeof body.range_days === "number" ? body.range_days : null,
      observed,
      resources: [],
      coverage: { level: "method_family", entity_analytics: "bounded_read_projection" },
      data_trust: body.data_trust ?? null,
      caveats: ["Resource entity_count is a unique count of bounded SHA-256 URI hashes; durable read analytics are available only after the entity-read projection is applied and refreshed. Raw URIs are never returned.", "Observed counts do not represent server uptime or complete resource availability."],
    }, request));
  };
}

export const GET = createResourcesHandler();
