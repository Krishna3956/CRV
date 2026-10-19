import { NextResponse } from "next/server.js";
import { authenticateAlertRequest, isAuthResult } from "../../../../lib/alerts/auth.ts";
import { parsePage } from "../../../../lib/alerts/policy.ts";
import { getSupabaseServer } from "../../../../lib/auth/supabase-server.ts";
import { getSupabaseAdmin } from "../../../../lib/repository/supabase.ts";
import { boundedJsonValue } from "../../../../lib/alerts/http.ts";

const STATUSES = new Set(["open", "acknowledged", "snoozed", "resolved"]);

function serialize(row: Record<string, unknown>, linkedAlerts?: unknown[]) {
  return {
    id: row.id,
    workspace_id: row.workspace_id,
    fingerprint: row.fingerprint,
    rule_key: row.rule_key,
    status: row.status,
    severity: row.severity,
    title: row.title,
    // Evidence is derived from telemetry and may contain user-controlled
    // strings. Keep the review API bounded and prevent raw payloads from
    // accidentally becoming part of the action-queue contract.
    evidence: boundedJsonValue(row.evidence ?? null, 8 * 1024),
    created_at: row.created_at,
    updated_at: row.updated_at,
    acknowledged_at: row.acknowledged_at ?? null,
    snoozed_until: row.snoozed_until ?? null,
    resolved_at: row.resolved_at ?? null,
    resolution_note: row.resolution_note ?? null,
    revision: row.revision,
    ...(linkedAlerts ? { linked_alerts: linkedAlerts.slice(0, 20) } : {}),
  };
}

export function createActionQueueHandlers(
  getAdmin: typeof getSupabaseAdmin = getSupabaseAdmin,
  getServer: typeof getSupabaseServer = getSupabaseServer,
) {
  async function GET(request: Request) {
    const auth = await authenticateAlertRequest(request, getAdmin, getServer);
    if (!isAuthResult(auth)) return auth.response;
    // Queue rows are product-review data, not ingest data. Do not expose them
    // through a bearer ingest key even though that key identifies a workspace.
    if (!auth.actorId) return NextResponse.json({ error: "Sign in to view the action queue." }, { status: 403 });
    const url = new URL(request.url);
    const limit = parsePage(url.searchParams.get("limit"));
    const status = url.searchParams.get("status");
    if (status && !STATUSES.has(status)) return NextResponse.json({ error: "Invalid action-queue status." }, { status: 400 });
    const beforeParam = url.searchParams.get("before");
    const before = beforeParam && Number.isFinite(Date.parse(beforeParam)) ? new Date(beforeParam).toISOString() : null;
    const includeAlerts = url.searchParams.get("include_alerts") === "true";
    let query = auth.admin
      .from("trackmcp_action_queue")
      .select("id, workspace_id, fingerprint, rule_key, status, severity, title, evidence, created_at, updated_at, acknowledged_at, snoozed_until, resolved_at, resolution_note, revision")
      .eq("workspace_id", auth.workspaceId)
      .order("created_at", { ascending: false })
      .limit(limit + 1);
    if (status) query = query.eq("status", status);
    if (before) query = query.lt("created_at", before);
    const result = await query;
    if (result.error) return NextResponse.json({ error: "Could not load action-queue items." }, { status: 500 });
    const rows = (result.data || []) as Record<string, unknown>[];
    const page = rows.slice(0, limit);
    const nextCursor = rows.length > limit ? (typeof page.at(-1)?.created_at === "string" ? page.at(-1)?.created_at : null) : null;
    let alertsByFingerprint = new Map<string, unknown[]>();
    if (includeAlerts) {
      const fingerprints = page.map((row) => typeof row.fingerprint === "string" ? row.fingerprint : "").filter(Boolean);
      if (fingerprints.length) {
        // The link migration is additive and may not yet exist in every
        // environment. A missing/failed optional join must not break queue
        // reads; it simply yields an empty related-alert list.
        try {
          const alertResult = await auth.admin.from("trackmcp_alert_incidents")
            .select("id, action_queue_fingerprint, state, severity, metric, first_seen_at, last_seen_at, resolved_at")
            .eq("workspace_id", auth.workspaceId)
            .in("action_queue_fingerprint", fingerprints)
            .order("last_seen_at", { ascending: false })
            .limit(Math.min(100, fingerprints.length * 20));
          if (!alertResult.error) {
            const incidentIds: string[] = [];
            for (const raw of (alertResult.data || []) as Array<Record<string, unknown>>) {
              const fingerprint = typeof raw.action_queue_fingerprint === "string" ? raw.action_queue_fingerprint : "";
              if (!fingerprint) continue;
              if (typeof raw.id === "string") incidentIds.push(raw.id);
              const current = alertsByFingerprint.get(fingerprint) || [];
              current.push({ id: raw.id, state: raw.state, severity: raw.severity, metric: raw.metric, first_seen_at: raw.first_seen_at, last_seen_at: raw.last_seen_at, resolved_at: raw.resolved_at });
              alertsByFingerprint.set(fingerprint, current);
            }
            if (incidentIds.length) {
              try {
                const deliveries = await auth.admin.from("trackmcp_alert_deliveries")
                  .select("incident_id, state, attempt_number, finished_at, http_status")
                  .eq("workspace_id", auth.workspaceId)
                  .in("incident_id", incidentIds)
                  .order("finished_at", { ascending: false })
                  .limit(Math.min(200, incidentIds.length * 20));
                if (!deliveries.error) {
                  const byIncident = new Map<string, Record<string, unknown>>();
                  for (const delivery of (deliveries.data || []) as Array<Record<string, unknown>>) {
                    const incidentId = typeof delivery.incident_id === "string" ? delivery.incident_id : "";
                    if (!incidentId || byIncident.has(incidentId)) continue;
                    byIncident.set(incidentId, { state: delivery.state, attempt_number: delivery.attempt_number, finished_at: delivery.finished_at, http_status: delivery.http_status });
                  }
                  for (const alerts of alertsByFingerprint.values()) for (const alert of alerts as Array<Record<string, unknown>>) {
                    const delivery = byIncident.get(String(alert.id));
                    if (delivery) alert.last_delivery = delivery;
                  }
                }
              } catch {
                // Delivery history is optional evidence; keep the incident link.
              }
            }
          }
        } catch {
          alertsByFingerprint = new Map();
        }
      }
    }
    return NextResponse.json({ data: page.map((row) => serialize(row, includeAlerts ? alertsByFingerprint.get(String(row.fingerprint)) || [] : undefined)), next_cursor: nextCursor, cursor_parameter: "before", limit });
  }

  return { GET };
}

export const GET = createActionQueueHandlers().GET;
