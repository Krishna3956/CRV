import { NextResponse } from "next/server.js";
import { createAnalyticsHandler } from "../../v1/analytics/handlers.ts";
import { withTrackMCPV2Envelope } from "../../../../lib/api/v2-envelope.ts";
import { projectTrackMCPDataTrust } from "../../../../lib/telemetry/data-trust.ts";

const MAX_TOOLS = 500;
const HASH = /^[a-f0-9]{64}$/i;
const DIFF_STATUS = new Set(["computed", "unchanged", "not_comparable"]);

function boundedHashes(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && HASH.test(item)).map((item) => item.toLowerCase()).slice(0, 128) : [];
}

function boundedCount(value: unknown): number {
  return typeof value === "number" && Number.isSafeInteger(value) ? Math.max(0, Math.min(1000000, value)) : 0;
}

function projectDiff(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const diff = value as Record<string, unknown>;
  return {
    status: typeof diff.status === "string" && DIFF_STATUS.has(diff.status) ? diff.status : "not_comparable",
    changed: diff.changed === true,
    added_name_count: boundedCount(diff.added_name_count),
    removed_name_count: boundedCount(diff.removed_name_count),
    added_uri_count: boundedCount(diff.added_uri_count),
    removed_uri_count: boundedCount(diff.removed_uri_count),
    added_name_hashes: boundedHashes(diff.added_name_hashes),
    removed_name_hashes: boundedHashes(diff.removed_name_hashes),
    added_uri_hashes: boundedHashes(diff.added_uri_hashes),
    removed_uri_hashes: boundedHashes(diff.removed_uri_hashes),
    bounded: diff.bounded === true,
  };
}

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
      catalog_snapshot_summary?: { notification_correlations?: unknown };
      catalog_next_cursor?: unknown;
      data_trust?: { observed_through?: string | null } | null;
    };
    const tools = Array.isArray(body.catalog_tools) ? body.catalog_tools.slice(0, MAX_TOOLS) : [];
    const observedAt = body.data_trust?.observed_through || null;
    const versions = Array.isArray(body.catalog_versions) ? body.catalog_versions.filter((value): value is Record<string, unknown> => Boolean(value && typeof value === "object")).slice(0, 100) : [];
    const historical = versions.map((version) => ({
      id: typeof version.id === "string" ? version.id : null,
      version: typeof version.snapshot_hash === "string" && HASH.test(version.snapshot_hash) ? version.snapshot_hash.toLowerCase() : null,
      observed_at: typeof version.discovered_at === "string" ? version.discovered_at : null,
      catalog_kind: typeof version.catalog_kind === "string" ? version.catalog_kind : null,
      item_count: typeof version.item_count === "number" && Number.isSafeInteger(version.item_count) ? Math.max(0, Math.min(1000000, version.item_count)) : null,
      item_name_hashes: boundedHashes(version.item_name_hashes),
      item_uri_hashes: boundedHashes(version.item_uri_hashes),
      complete: version.complete === true,
      truncated: version.truncated === true,
      previous_snapshot_id: typeof version.previous_snapshot_id === "string" ? version.previous_snapshot_id : null,
      diff: projectDiff(version.diff),
    }));
    const notificationCorrelations = Array.isArray(body.catalog_snapshot_summary?.notification_correlations)
      ? body.catalog_snapshot_summary.notification_correlations.flatMap((value) => {
        if (!value || typeof value !== "object" || Array.isArray(value)) return [];
        const row = value as Record<string, unknown>;
        const kind = row.kind === "tools" || row.kind === "resources" || row.kind === "resource_templates" || row.kind === "prompts" ? row.kind : null;
        if (!kind) return [];
        const bounded = (field: string) => typeof row[field] === "number" && Number.isSafeInteger(row[field]) ? Math.max(0, Math.min(100000, row[field] as number)) : 0;
        const boundedWindow = typeof row.match_window_ms === "number" && Number.isSafeInteger(row.match_window_ms) ? Math.max(0, Math.min(3600000, row.match_window_ms)) : 0;
        const status = row.status === "available" || row.status === "no_notifications" || row.status === "no_snapshots" ? row.status : "no_snapshots";
        return [{ kind, notifications: bounded("notifications"), matched_notifications: bounded("matched_notifications"), ambiguous_notifications: bounded("ambiguous_notifications"), unmatched_notifications: bounded("unmatched_notifications"), snapshots: bounded("snapshots"), match_window_ms: boundedWindow, status }];
      }).slice(0, 4)
      : [];
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
        notification_correlations: notificationCorrelations,
      },
      pagination: {
        next_cursor: typeof body.catalog_next_cursor === "string" ? body.catalog_next_cursor : null,
        cursor_parameter: "catalog_before",
        caveat: "The cursor is an opaque workspace-bound continuation token; it does not expose timestamps, workspace identifiers, or catalog payloads.",
      },
      data_trust: projectTrackMCPDataTrust(body.data_trust),
      catalog_version_status: body.catalog_version_status ?? "unknown",
    }, request, { caveats: historical.length ? ["Historical rows contain bounded hashes and counts; raw catalog names and URIs are never returned."] : ["No workspace snapshot rows are available; this is the current bounded analytics projection."] }));
  };
}

export const GET = createCatalogsHandler();
