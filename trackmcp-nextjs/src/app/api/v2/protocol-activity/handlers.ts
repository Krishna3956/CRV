import { NextResponse } from "next/server.js";
import { createAnalyticsHandler } from "../../v1/analytics/handlers.ts";
import { withTrackMCPV2Envelope } from "../../../../lib/api/v2-envelope.ts";

const FAMILIES = new Set(["sampling", "elicitation", "completion", "tasks", "control_signal", "resources", "prompts", "tools", "subscriptions", "notifications"]);

/**
 * Exposes the bounded modern-protocol family projection as a stable v2 read
 * surface. Counts describe metadata observed at the server boundary; they do
 * not imply demand, success, or customer workflow completion.
 */
export function createProtocolActivityHandler(analytics = createAnalyticsHandler()) {
  return async function GET(request: Request) {
    const response = await analytics(request);
    if (!response.ok) return response;
    const body = await response.json() as { range_days?: unknown; protocol_family_activity?: unknown; data_trust?: unknown };
    const activity = Array.isArray(body.protocol_family_activity)
      ? body.protocol_family_activity
        .filter((value): value is { family: string; observations: number } => Boolean(value && typeof value === "object" && typeof (value as { family?: unknown }).family === "string" && typeof (value as { observations?: unknown }).observations === "number"))
        .filter((value) => FAMILIES.has(value.family))
        .map((value) => ({ family: value.family, observations: Math.max(0, Math.min(100_000, Math.floor(value.observations))) }))
        .sort((a, b) => b.observations - a.observations || a.family.localeCompare(b.family))
        .slice(0, 10)
      : [];
    return NextResponse.json(withTrackMCPV2Envelope({
      range_days: typeof body.range_days === "number" ? body.range_days : null,
      protocol_family_activity: activity,
      family_count: activity.length,
      data_trust: body.data_trust ?? null,
    }, request, { caveats: ["Counts are bounded protocol metadata observations at the server boundary, not customer demand, successful outcomes, or feature support claims."] }));
  };
}

export const GET = createProtocolActivityHandler();
