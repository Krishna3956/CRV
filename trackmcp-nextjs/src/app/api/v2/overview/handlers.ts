import { createAnalyticsHandler } from "../../v1/analytics/handlers.ts";
import { envelopeV2Response } from "../../../../lib/api/v2-envelope.ts";

/**
 * Versioned Founder OS overview contract. The first version intentionally
 * reuses the bounded analytics projection so v1 and v2 cannot drift while the
 * dedicated read-model endpoints are introduced incrementally.
 */
export function createOverviewHandler(analytics = createAnalyticsHandler()) {
  return async function GET(request: Request) {
    return envelopeV2Response(await analytics(request), request);
  };
}

export const GET = createOverviewHandler();
