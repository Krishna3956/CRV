import { NextResponse } from "next/server.js";
import { createAnalyticsHandler } from "../../v1/analytics/handlers.ts";
import { withTrackMCPV2Envelope } from "../../../../lib/api/v2-envelope.ts";
import { projectTrackMCPDataTrust } from "../../../../lib/telemetry/data-trust.ts";
import { projectObservedSurface, projectReadActivity } from "../read-model-projections.ts";

export function createResourcesHandler(analytics = createAnalyticsHandler()) {
  return async function GET(request: Request) {
    const response = await analytics(request);
    if (!response.ok) return response;
    const body = await response.json() as { range_days?: unknown; interaction_surfaces?: { resources?: unknown }; resource_prompt_activity?: { resource_reads?: unknown; resource_observations?: unknown; previous_period_resource_reads?: unknown; resource_completion_rate?: unknown; resource_stall_rate?: unknown; resource_error_rate?: unknown; outcomes?: Array<{ kind?: unknown }>; resource_breakdown?: unknown; trend?: Array<{ kind?: unknown }> }; data_trust?: unknown };
    const observed = projectObservedSurface(body.interaction_surfaces?.resources, { events: 0, methods: [], entity_analytics: { status: "schema_unavailable" } });
    const activity = projectReadActivity(body.resource_prompt_activity as Record<string, unknown> | undefined, "resource");
    return NextResponse.json(withTrackMCPV2Envelope({
      range_days: typeof body.range_days === "number" ? body.range_days : null,
      observed,
      activity,
      resources: [],
      coverage: { level: "method_family", entity_analytics: "bounded_read_projection" },
      data_trust: projectTrackMCPDataTrust(body.data_trust),
      caveats: ["Resource entity_count is a unique count of bounded SHA-256 URI hashes; durable read analytics are available only after the entity-read projection is applied and refreshed. Raw URIs are never returned.", "Only resources/read is counted as product-use activity. Explicitly linked retries are collapsed; unlinked repeats remain separate observations.", "Observed counts do not represent server uptime or complete resource availability."],
    }, request));
  };
}

export const GET = createResourcesHandler();
