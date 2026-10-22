import { NextResponse } from "next/server.js";
import { createAnalyticsHandler } from "../../v1/analytics/handlers.ts";
import { withTrackMCPV2Envelope } from "../../../../lib/api/v2-envelope.ts";
import { projectTrackMCPDataTrust } from "../../../../lib/telemetry/data-trust.ts";

const MAX_TEXT = 128;
const boundedText = (value: unknown) => typeof value === "string" ? value.slice(0, MAX_TEXT) : null;
const boundedInt = (value: unknown, max = 1000000) => typeof value === "number" && Number.isSafeInteger(value) ? Math.max(0, Math.min(max, value)) : 0;
const boundedRate = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : null;

function projectClient(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  return { name: boundedText(row.name), calls: boundedInt(row.calls), ...(row.share !== undefined ? { share: boundedRate(row.share) } : {}) };
}

function projectPeopleModel(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  const growth = Array.isArray(row.growth) ? row.growth.slice(0, 90).flatMap((item): Record<string, unknown>[] => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const entry = item as Record<string, unknown>;
    return [{ period_start: boundedText(entry.period_start), active_accounts: boundedInt(entry.active_accounts) }];
  }) : [];
  const clientBreakdown = Array.isArray(row.client_breakdown) ? row.client_breakdown.slice(0, 100).map(projectClient).filter((item): item is Record<string, unknown> => item !== null) : [];
  const topAccounts = Array.isArray(row.top_accounts) ? row.top_accounts.slice(0, 100).flatMap((item): Record<string, unknown>[] => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const entry = item as Record<string, unknown>;
    return [{ rank: boundedInt(entry.rank, 100), activity_count: boundedInt(entry.activity_count), active_days: boundedInt(entry.active_days, 366), identity_source: boundedText(entry.identity_source) }];
  }) : [];
  return {
    active_accounts: boundedInt(row.active_accounts), previous_period_active_accounts: boundedInt(row.previous_period_active_accounts),
    new_accounts: boundedInt(row.new_accounts), returning_accounts: boundedInt(row.returning_accounts),
    classification_status: boundedText(row.classification_status), growth, client_breakdown: clientBreakdown,
    top_accounts: topAccounts, identity_coverage: boundedRate(row.identity_coverage), limitation: boundedText(row.limitation),
  };
}

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
      client_observations: Array.isArray(body.clients) ? body.clients.slice(0, 100).map(projectClient).filter((item): item is Record<string, unknown> => item !== null) : [],
      // Keep the complete, privacy-safe People read model available from the
      // versioned endpoint. The previous projection exposed only fragments,
      // which made a consumer reconstruct a first-seen classification itself.
      who_is_using_it: projectPeopleModel(body.who_is_using_it),
      activity_signals: {
        active_account_signals: typeof body.account_summary?.active_account_keys === "number" ? body.account_summary.active_account_keys : null,
        active_account_signals_7d: typeof body.account_summary?.active_account_keys_7d === "number" ? body.account_summary.active_account_keys_7d : null,
        returning_account_signals: typeof body.account_summary?.returning_account_keys === "number" ? body.account_summary.returning_account_keys : null,
        account_activity_bands: body.account_summary?.account_activity_bands && typeof body.account_summary.account_activity_bands === "object"
          ? Object.fromEntries(Object.entries(body.account_summary.account_activity_bands).slice(0, 8).map(([key, value]) => [key.slice(0, MAX_TEXT), boundedInt(value)]))
          : null,
      },
      unique_people: null,
      unique_organizations: null,
      data_trust: projectTrackMCPDataTrust(body.data_trust),
      caveats: [
        "Client metadata is self-reported protocol context, not a verified person identity.",
        "TrackMCP does not infer unique people or organizations from event counts.",
      ],
    }, request));
  };
}

export const GET = createPeopleHandler();
