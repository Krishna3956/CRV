import { NextResponse } from "next/server.js";
import { authenticateAlertRequest, isAuthResult } from "@/lib/alerts/auth.ts";
import { parsePage } from "@/lib/alerts/policy.ts";
import { serializeIncident } from "@/lib/alerts/serialize.ts";

export async function GET(request: Request) {
  const auth = await authenticateAlertRequest(request);
  if (!isAuthResult(auth)) return auth.response;
  const url = new URL(request.url);
  const limit = parsePage(url.searchParams.get("limit"));
  let query = auth.admin.from("trackmcp_alert_incidents").select("*").eq("workspace_id", auth.workspaceId).order("last_seen_at", { ascending: false }).limit(limit);
  const state = url.searchParams.get("state");
  const metric = url.searchParams.get("metric");
  const toolName = url.searchParams.get("tool_name");
  const environment = url.searchParams.get("environment");
  if (state) query = query.eq("state", state);
  if (metric) query = query.eq("metric", metric);
  if (toolName) query = query.eq("tool_name", toolName);
  if (environment) query = query.eq("environment", environment);
  const result = await query;
  if (result.error) return NextResponse.json({ error: "Could not load alert incidents." }, { status: 500 });
  return NextResponse.json({ data: (result.data || []).map((row: Record<string, unknown>) => serializeIncident(row)), next_cursor: null, limit });
}
