import { NextResponse } from "next/server.js";
import { authenticateAlertRequest, isAuthResult } from "@/lib/alerts/auth.ts";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await authenticateAlertRequest(request);
  if (!isAuthResult(auth)) return auth.response;
  const { id } = await context.params;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Request body must be an object." }, { status: 400 });
  const value = body as Record<string, unknown>;
  const update: Record<string, unknown> = {};
  if (typeof value.enabled === "boolean") update.enabled = value.enabled;
  if (value.revoke === true) { update.enabled = false; update.revoked_at = new Date().toISOString(); }
  if (typeof value.secret_ref === "string" && value.secret_ref.trim() === value.secret_ref && value.secret_ref.length > 0 && new TextEncoder().encode(value.secret_ref).byteLength <= 512) { update.secret_ref = value.secret_ref; update.rotated_at = new Date().toISOString(); update.revoked_at = null; }
  if (!Object.keys(update).length) return NextResponse.json({ error: "No valid destination change supplied." }, { status: 400 });
  update.updated_at = new Date().toISOString();
  const result = await auth.admin.from("trackmcp_alert_destinations").update(update).eq("workspace_id", auth.workspaceId).eq("id", id).select("id, workspace_id, kind, endpoint_url, enabled, revoked_at, rotated_at, created_at, updated_at").maybeSingle();
  if (result.error) return NextResponse.json({ error: "Could not update alert destination." }, { status: 500 });
  if (!result.data) return NextResponse.json({ error: "Alert destination not found." }, { status: 404 });
  return NextResponse.json(result.data);
}
