import { NextResponse } from "next/server.js";
import { authenticateAlertRequest, isAuthResult } from "../../../../lib/alerts/auth.ts";
import { configRow, destinationsBelongToWorkspace, parseAlertConfigInput } from "../../../../lib/alerts/config.ts";
import { parsePage } from "../../../../lib/alerts/policy.ts";
import { serializeConfiguration } from "../../../../lib/alerts/serialize.ts";
import { getSupabaseServer } from "../../../../lib/auth/supabase-server.ts";
import { getSupabaseAdmin } from "../../../../lib/repository/supabase.ts";
import { readBoundedJson } from "../../../../lib/alerts/http.ts";

export function createAlertsHandlers(getAdmin: typeof getSupabaseAdmin = getSupabaseAdmin, getServer: typeof getSupabaseServer = getSupabaseServer) {
  async function GET(request: Request) {
  const auth = await authenticateAlertRequest(request, getAdmin, getServer);
  if (!isAuthResult(auth)) return auth.response;
  const url = new URL(request.url);
  const limit = parsePage(url.searchParams.get("limit"));
  const query = auth.admin.from("trackmcp_alert_configs")
    .select("id, workspace_id, metric, tool_name, environment, destination_ids, policy_version, enabled, paused, created_at, updated_at")
    .eq("workspace_id", auth.workspaceId)
    .order("created_at", { ascending: false })
    .limit(limit);
  const result = await query;
  if (result.error) return NextResponse.json({ error: "Could not load alert configurations." }, { status: 500 });
  return NextResponse.json({ data: (result.data || []).map((row: Record<string, unknown>) => serializeConfiguration(row)), next_cursor: null, limit });
  }

  async function POST(request: Request) {
  const auth = await authenticateAlertRequest(request, getAdmin, getServer);
  if (!isAuthResult(auth)) return auth.response;
  const body = await readBoundedJson(request);
  if (body && typeof body === "object" && "error" in body && "code" in body) return NextResponse.json({ error: body.error }, { status: body.code === "too_large" ? 413 : 400 });
  const input = parseAlertConfigInput(body);
  if ("error" in input) return NextResponse.json(input, { status: 400 });
  if (!await destinationsBelongToWorkspace(auth.admin, auth.workspaceId, input.destination_ids)) return NextResponse.json({ error: "destination_ids must belong to this workspace." }, { status: 400 });
  const result = await auth.admin.from("trackmcp_alert_configs").insert(configRow(auth.workspaceId, input)).select("id, workspace_id, metric, tool_name, environment, destination_ids, policy_version, enabled, paused, created_at, updated_at").single();
  if (result.error || !result.data) return NextResponse.json({ error: "Could not create alert configuration." }, { status: result.error?.code === "23514" ? 400 : 500 });
  return NextResponse.json(serializeConfiguration(result.data as Record<string, unknown>), { status: 201 });
  }
  return { GET, POST };
}

const handlers = createAlertsHandlers();
export const GET = handlers.GET;
export const POST = handlers.POST;
