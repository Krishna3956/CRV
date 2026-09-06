import { NextResponse } from "next/server.js";
import { authenticateAlertRequest, isAuthResult } from "@/lib/alerts/auth.ts";
import { serializeIncident } from "@/lib/alerts/serialize.ts";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await authenticateAlertRequest(request);
  if (!isAuthResult(auth)) return auth.response;
  const { id } = await context.params;
  const result = await auth.admin.from("trackmcp_alert_incidents").select("*").eq("workspace_id", auth.workspaceId).eq("id", id).maybeSingle();
  if (result.error) return NextResponse.json({ error: "Could not load alert incident." }, { status: 500 });
  if (!result.data) return NextResponse.json({ error: "Alert incident not found." }, { status: 404 });
  return NextResponse.json(serializeIncident(result.data as Record<string, unknown>));
}
