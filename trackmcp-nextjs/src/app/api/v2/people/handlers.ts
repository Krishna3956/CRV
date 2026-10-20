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
      who_is_using_it?: unknown;
      account_summary?: { active_account_keys?: unknown; active_account_keys_7d?: unknown; returning_account_keys?: unknown; account_activity_bands?: unknown };
      founder_os?: { identity_coverage?: unknown; identity_source_counts?: unknown };
      data_trust?: unknown;
    };
    return NextResponse.json(withTrackMCPV2Envelope({
      range_days: typeof body.range_days === "number" ? body.range_days : null,
      identity_coverage: body.founder_os?.identity_coverage ?? null,
      identity_source_counts: body.founder_os?.identity_source_counts ?? { resolver: 0, unresolved: 0 },
      client_observations: Array.isArray(body.clients) ? body.clients.slice(0, 100) : [],
      // Keep the complete, privacy-safe People read model available from the
      // versioned endpoint. The previous projection exposed only fragments,
      // which made a consumer reconstruct a first-seen classification itself.
      who_is_using_it: body.who_is_using_it && typeof body.who_is_using_it === "object"
        ? body.who_is_using_it
        : null,
      activity_signals: {
        active_account_signals: typeof body.account_summary?.active_account_keys === "number" ? body.account_summary.active_account_keys : null,
        active_account_signals_7d: typeof body.account_summary?.active_account_keys_7d === "number" ? body.account_summary.active_account_keys_7d : null,
        returning_account_signals: typeof body.account_summary?.returning_account_keys === "number" ? body.account_summary.returning_account_keys : null,
        account_activity_bands: body.account_summary?.account_activity_bands ?? null,
      },
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
