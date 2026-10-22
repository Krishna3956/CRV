import { NextResponse } from "next/server.js";
import { createAnalyticsHandler } from "../../v1/analytics/handlers.ts";
import { withTrackMCPV2Envelope } from "../../../../lib/api/v2-envelope.ts";
import { projectTrackMCPDataTrust } from "../../../../lib/telemetry/data-trust.ts";

/**
 * Bounded provenance surface for integrations that need freshness and scan
 * completeness without consuming the full overview payload.
 */
export function createDataTrustHandler(analytics = createAnalyticsHandler()) {
  return async function GET(request: Request) {
    const response = await analytics(request);
    if (!response.ok) return response;
    const body = await response.json() as { range_days?: number; data_trust?: unknown };
    return NextResponse.json(withTrackMCPV2Envelope({ range_days: body.range_days ?? null, data_trust: projectTrackMCPDataTrust(body.data_trust) }, request));
  };
}

export const GET = createDataTrustHandler();
