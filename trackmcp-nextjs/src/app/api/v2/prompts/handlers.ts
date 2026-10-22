import { NextResponse } from "next/server.js";
import { createAnalyticsHandler } from "../../v1/analytics/handlers.ts";
import { withTrackMCPV2Envelope } from "../../../../lib/api/v2-envelope.ts";
import { projectObservedSurface, projectReadActivity } from "../read-model-projections.ts";

export function createPromptsHandler(analytics = createAnalyticsHandler()) {
  return async function GET(request: Request) {
    const response = await analytics(request);
    if (!response.ok) return response;
    const body = await response.json() as { range_days?: unknown; interaction_surfaces?: { prompts?: unknown }; resource_prompt_activity?: { prompt_calls?: unknown; prompt_observations?: unknown; previous_period_prompt_calls?: unknown; prompt_completion_rate?: unknown; prompt_stall_rate?: unknown; prompt_error_rate?: unknown; outcomes?: Array<{ kind?: unknown }>; prompt_breakdown?: unknown; trend?: Array<{ kind?: unknown }> }; data_trust?: unknown };
    const observed = projectObservedSurface(body.interaction_surfaces?.prompts, { events: 0, methods: [], entity_analytics: { status: "schema_unavailable" } });
    const activity = projectReadActivity(body.resource_prompt_activity as Record<string, unknown> | undefined, "prompt");
    return NextResponse.json(withTrackMCPV2Envelope({
      range_days: typeof body.range_days === "number" ? body.range_days : null,
      observed,
      activity,
      prompts: [],
      coverage: { level: "method_family", entity_analytics: "bounded_read_projection" },
      data_trust: body.data_trust ?? null,
      caveats: ["Prompt entity_count is a unique count of bounded SHA-256 name hashes; durable read analytics are available only after the entity-read projection is applied and refreshed. Raw names/arguments are never returned.", "Only prompts/get is counted as product-use activity. Explicitly linked retries are collapsed; unlinked repeats remain separate observations.", "Observed counts do not represent unique business completions or successful prompt execution."],
    }, request));
  };
}

export const GET = createPromptsHandler();
