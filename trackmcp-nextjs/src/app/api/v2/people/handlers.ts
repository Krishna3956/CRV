import { NextResponse } from "next/server.js";
import { createAnalyticsHandler } from "../../v1/analytics/handlers.ts";
import { withTrackMCPV2Envelope } from "../../../../lib/api/v2-envelope.ts";

/**
 * People is intentionally a declared observation contract, not a user table.
 * Until verified account identity exists, the only safe public projection is
 * resolver coverage plus observed client metadata.
 */
export function createPeopleHandler(analytics = createAnalyticsHandler()) {
  return async function GET(request: Request) {
    const response = await analytics(request);
    if (!response.ok) return response;
    const body = await response.json() as {
      range_days?: unknown;
      clients?: unknown;
      founder_os?: { identity_coverage?: unknown; identity_source_counts?: unknown };
      data_trust?: unknown;
    };
    return NextResponse.json(withTrackMCPV2Envelope({
      range_days: typeof body.range_days === "number" ? body.range_days : null,
      identity_coverage: body.founder_os?.identity_coverage ?? null,
      identity_source_counts: body.founder_os?.identity_source_counts ?? { resolver: 0, unresolved: 0 },
      client_observations: Array.isArray(body.clients) ? body.clients.slice(0, 100) : [],
      unique_people: null,
      unique_organizations: null,
      data_trust: body.data_trust ?? null,
      caveats: [
        "Client metadata is self-reported protocol context, not a verified person identity.",
        "TrackMCP does not infer unique people or organizations from event counts.",
      ],
    }, request));
  };
}

export const GET = createPeopleHandler();
