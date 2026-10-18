import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/repository/supabase";

function matchesSecret(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function boundedDate(value: string | null, fallback: string): string {
  if (!value || value.length > 40 || Number.isNaN(Date.parse(value))) return fallback;
  return new Date(value).toISOString();
}

export async function GET(request: Request) {
  const expected = process.env.TRACKMCP_ADMIN_KEY;
  const provided = request.headers.get("x-trackmcp-admin-key") || "";
  if (!expected || !matchesSecret(provided, expected)) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: "Activation reporting is not configured." }, { status: 503 });
  const url = new URL(request.url);
  const from = boundedDate(url.searchParams.get("from"), new Date(Date.now() - 30 * 86400_000).toISOString());
  const to = boundedDate(url.searchParams.get("to"), new Date().toISOString());
  const sessionQuery = () => admin.from("trackmcp_cli_device_sessions").select("id, status, client_version, sdk_package, package_manager, platform, created_at, approved_workspace_id, created_key_id", { count: "exact" }).gte("created_at", from).lt("created_at", to);
  const [sessions, milestones, funnelEvents] = await Promise.all([
    sessionQuery(),
    admin.from("trackmcp_activation_milestones").select("id, workspace_id, key_id, first_accepted_at, sdk_version, service, environment, event_type, observation_source", { count: "exact" }).gte("first_accepted_at", from).lt("first_accepted_at", to),
    admin.from("trackmcp_activation_funnel_events").select("event_type, source", { count: "exact" }).gte("occurred_at", from).lt("occurred_at", to),
  ]);
  if (sessions.error || milestones.error || funnelEvents.error) return NextResponse.json({ error: "Could not load activation report." }, { status: 500 });
  const rows = sessions.data || [];
  const statusCounts = rows.reduce<Record<string, number>>((acc, row) => { acc[row.status] = (acc[row.status] || 0) + 1; return acc; }, {});
  const eventCounts = (funnelEvents.data || []).reduce<Record<string, number>>((acc, row) => { const key = `${row.event_type}:${row.source}`; acc[key] = (acc[key] || 0) + 1; return acc; }, {});
  return NextResponse.json({
    range: { from, to },
    device_sessions: { started: rows.length, by_status: statusCounts, approved: statusCounts.approved || 0, redeemed: statusCounts.redeemed || 0 },
    funnel_events: eventCounts,
    first_accepted_ingest: { count: milestones.count || 0, by_observation_source: (milestones.data || []).reduce<Record<string, number>>((acc, row) => { acc[row.observation_source] = (acc[row.observation_source] || 0) + 1; return acc; }, {}) },
    npm_downloads: { value: null, label: "aggregate downloads; not unique users" },
  }, { headers: { "cache-control": "no-store" } });
}
