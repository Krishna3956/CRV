import { NextResponse } from "next/server.js";
import { authenticateAlertRequest, isAuthResult } from "../../../../../lib/alerts/auth.ts";
import { destinationsBelongToWorkspace, parseAlertConfigInput } from "../../../../../lib/alerts/config.ts";
import { serializeConfiguration } from "../../../../../lib/alerts/serialize.ts";
import { readBoundedJson } from "../../../../../lib/alerts/http.ts";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  const auth = await authenticateAlertRequest(request);
  if (!isAuthResult(auth)) return auth.response;
  const { id } = await context.params;
  const result = await auth.admin.from("trackmcp_alert_configs").select("id, workspace_id, metric, tool_name, environment, destination_ids, policy_version, enabled, paused, created_at, updated_at").eq("workspace_id", auth.workspaceId).eq("id", id).maybeSingle();
  if (result.error) return NextResponse.json({ error: "Could not load alert configuration." }, { status: 500 });
  if (!result.data) return NextResponse.json({ error: "Alert configuration not found." }, { status: 404 });
  return NextResponse.json(serializeConfiguration(result.data as Record<string, unknown>));
}

export async function PATCH(request: Request, context: Context) {
  const auth = await authenticateAlertRequest(request);
  if (!isAuthResult(auth)) return auth.response;
  const { id } = await context.params;
  const body = await readBoundedJson(request);
  if (body && typeof body === "object" && "error" in body && "code" in body) return NextResponse.json({ error: body.error }, { status: body.code === "too_large" ? 413 : 400 });
  const input = parseAlertConfigInput(body, true);
  if ("error" in input) return NextResponse.json(input, { status: 400 });
  const bodyRecord = body as Record<string, unknown>;
  const changes: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (bodyRecord.metric !== undefined) changes.metric = input.metric;
  if (bodyRecord.tool_name !== undefined) changes.tool_name = input.tool_name;
  if (bodyRecord.environment !== undefined) changes.environment = input.environment;
  if (bodyRecord.destination_ids !== undefined) changes.destination_ids = input.destination_ids;
  if (bodyRecord.enabled !== undefined) changes.enabled = input.enabled;
  if (bodyRecord.paused !== undefined) changes.paused = input.paused;
  if (bodyRecord.destination_ids !== undefined && !await destinationsBelongToWorkspace(auth.admin, auth.workspaceId, input.destination_ids)) return NextResponse.json({ error: "destination_ids must belong to this workspace." }, { status: 400 });
  const result = await auth.admin.from("trackmcp_alert_configs").update(changes).eq("workspace_id", auth.workspaceId).eq("id", id).select("id, workspace_id, metric, tool_name, environment, destination_ids, policy_version, enabled, paused, created_at, updated_at").maybeSingle();
  if (result.error) return NextResponse.json({ error: "Could not update alert configuration." }, { status: 500 });
  if (!result.data) return NextResponse.json({ error: "Alert configuration not found." }, { status: 404 });
  return NextResponse.json(serializeConfiguration(result.data as Record<string, unknown>));
}

export async function DELETE(request: Request, context: Context) {
  const auth = await authenticateAlertRequest(request);
  if (!isAuthResult(auth)) return auth.response;
  const { id } = await context.params;
  const result = await auth.admin.from("trackmcp_alert_configs").update({ enabled: false, paused: true, updated_at: new Date().toISOString() }).eq("workspace_id", auth.workspaceId).eq("id", id);
  if (result.error) return NextResponse.json({ error: "Could not disable alert configuration." }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
