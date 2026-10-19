import { NextResponse } from "next/server.js";
import { createAnalyticsHandler } from "../../v1/analytics/handlers.ts";
import { withTrackMCPV2Envelope } from "../../../../lib/api/v2-envelope.ts";

export function createPromptsHandler(analytics = createAnalyticsHandler()) {
  return async function GET(request: Request) {
    const response = await analytics(request);
    if (!response.ok) return response;
    const body = await response.json() as { range_days?: unknown; interaction_surfaces?: { prompts?: unknown }; data_trust?: unknown };
    const observed = body.interaction_surfaces?.prompts ?? { events: 0, methods: [], entity_analytics: { status: "schema_unavailable" } };
    return NextResponse.json(withTrackMCPV2Envelope({
      range_days: typeof body.range_days === "number" ? body.range_days : null,
      observed,
      prompts: [],
      coverage: { level: "method_family", entity_analytics: "bounded_read_projection" },
      data_trust: body.data_trust ?? null,
      caveats: ["Prompt entity_count is a unique count of bounded SHA-256 name hashes; durable read analytics are available only after the entity-read projection is applied and refreshed. Raw names/arguments are never returned.", "Observed counts do not represent unique completions or successful prompt execution."],
    }, request));
  };
}

export const GET = createPromptsHandler();
