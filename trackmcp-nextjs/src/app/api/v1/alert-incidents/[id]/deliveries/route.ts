import { NextResponse } from "next/server.js";
import { authenticateAlertRequest, isAuthResult } from "@/lib/alerts/auth.ts";
import { parsePage } from "@/lib/alerts/policy.ts";
import { serializeDelivery } from "@/lib/alerts/serialize.ts";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await authenticateAlertRequest(request);
  if (!isAuthResult(auth)) return auth.response;
  const { id } = await context.params;
  const limit = parsePage(new URL(request.url).searchParams.get("limit"));
  const result = await auth.admin.from("trackmcp_alert_deliveries").select("id, workspace_id, incident_id, destination_id, state, attempt_number, http_status, error_code, started_at, finished_at").eq("workspace_id", auth.workspaceId).eq("incident_id", id).order("started_at", { ascending: false }).limit(limit);
  if (result.error) return NextResponse.json({ error: "Could not load delivery attempts." }, { status: 500 });
  return NextResponse.json({ data: (result.data || []).map((row: Record<string, unknown>) => serializeDelivery(row)), next_cursor: null, limit });
}
