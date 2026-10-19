import { NextResponse } from "next/server.js";
import { createAnalyticsHandler } from "../../v1/analytics/handlers.ts";
import { withTrackMCPV2Envelope } from "../../../../lib/api/v2-envelope.ts";

const MAX_TOOLS = 500;

/**
 * Returns the latest bounded catalog projection available to the workspace.
 *
 * Snapshot rows are loaded by the workspace-scoped analytics projection. This
 * keeps authorization and time bounds identical to the existing analytics
 * surface while exposing only bounded hashes and counts to the browser.
 */
export function createCatalogsHandler(analytics = createAnalyticsHandler()) {
  return async function GET(request: Request) {
    const response = await analytics(request);
    if (!response.ok) return response;

    const body = await response.json() as {
      range_days?: number;
      protocol_versions?: unknown;
      catalog_tools?: unknown;
      catalog_versions?: unknown;
      catalog_version_status?: string;
      catalog_next_cursor?: unknown;
      data_trust?: { observed_through?: string | null } | null;
    };
    const tools = Array.isArray(body.catalog_tools) ? body.catalog_tools.slice(0, MAX_TOOLS) : [];
    const observedAt = body.data_trust?.observed_through || null;
    const versions = Array.isArray(body.catalog_versions) ? body.catalog_versions.filter((value): value is Record<string, unknown> => Boolean(value && typeof value === "object")).slice(0, 100) : [];
    const historical = versions.map((version) => ({
      id: typeof version.id === "string" ? version.id : null,
      version: typeof version.snapshot_hash === "string" ? version.snapshot_hash : null,
      observed_at: typeof version.discovered_at === "string" ? version.discovered_at : null,
      catalog_kind: typeof version.catalog_kind === "string" ? version.catalog_kind : null,
      item_count: typeof version.item_count === "number" ? version.item_count : null,
      item_name_hashes: Array.isArray(version.item_name_hashes) ? version.item_name_hashes.slice(0, 128) : [],
      item_uri_hashes: Array.isArray(version.item_uri_hashes) ? version.item_uri_hashes.slice(0, 128) : [],
      complete: version.complete === true,
      truncated: version.truncated === true,
      previous_snapshot_id: typeof version.previous_snapshot_id === "string" ? version.previous_snapshot_id : null,
      diff: version.diff && typeof version.diff === "object" ? version.diff : {},
    }));
    return NextResponse.json(withTrackMCPV2Envelope({
      range_days: body.range_days ?? null,
      catalogs: [{
        id: "current",
        version: null,
        observed_at: observedAt,
        protocol_versions: Array.isArray(body.protocol_versions) ? body.protocol_versions.slice(0, 100) : [],
        tool_count: tools.length,
        tools,
      }, ...historical],
      snapshot_source: historical.length ? "worker_snapshot_rows_plus_bounded_analytics" : "bounded_analytics_projection",
      versioning: {
        status: historical.length ? "snapshot_rows_available" : "current_projection",
        historical_versions: historical.length > 0,
        diff_status: historical.some((version) => version.previous_snapshot_id) ? "available" : "awaiting_previous_snapshot_join",
        identifiers: "sha256_hashes_only",
        caveat: "A partial or truncated observation is not evidence that an item was removed.",
      },
      pagination: {
        next_cursor: typeof body.catalog_next_cursor === "string" ? body.catalog_next_cursor : null,
        cursor_parameter: "catalog_before",
        caveat: "The cursor is an opaque bounded observation timestamp; it remains workspace-scoped and does not expose catalog payloads.",
      },
      data_trust: body.data_trust ?? null,
      catalog_version_status: body.catalog_version_status ?? "unknown",
    }, request, { caveats: historical.length ? ["Historical rows contain bounded hashes and counts; raw catalog names and URIs are never returned."] : ["No workspace snapshot rows are available; this is the current bounded analytics projection."] }));
  };
}

export const GET = createCatalogsHandler();
