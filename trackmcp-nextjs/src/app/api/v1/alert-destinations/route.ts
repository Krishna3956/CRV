import { NextResponse } from "next/server.js";
import { authenticateAlertRequest, isAuthResult } from "@/lib/alerts/auth.ts";

const MAX_URL_BYTES = 2048;
const MAX_SECRET_REF_BYTES = 512;

function parseDestination(body: unknown): { kind: "webhook"; endpoint_url: string; secret_ref: string; enabled: boolean } | { error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { error: "Request body must be an object." };
  const value = body as Record<string, unknown>;
  if (value.kind !== "webhook") return { error: "Only generic webhook destinations are supported in this phase." };
  if (typeof value.endpoint_url !== "string" || new TextEncoder().encode(value.endpoint_url).byteLength > MAX_URL_BYTES) return { error: "endpoint_url must be a bounded URL." };
  let endpoint: URL;
  try { endpoint = new URL(value.endpoint_url); } catch { return { error: "endpoint_url must be a valid HTTPS URL." }; }
  if (endpoint.protocol !== "https:" || endpoint.username || endpoint.password) return { error: "Webhook endpoints must use HTTPS without embedded credentials." };
  if (typeof value.secret_ref !== "string" || value.secret_ref.trim() !== value.secret_ref || value.secret_ref.length === 0 || new TextEncoder().encode(value.secret_ref).byteLength > MAX_SECRET_REF_BYTES) return { error: "secret_ref must be a bounded reference." };
  return { kind: "webhook", endpoint_url: endpoint.toString(), secret_ref: value.secret_ref, enabled: value.enabled !== false };
}

export async function GET(request: Request) {
  const auth = await authenticateAlertRequest(request);
  if (!isAuthResult(auth)) return auth.response;
  const result = await auth.admin.from("trackmcp_alert_destinations").select("id, workspace_id, kind, endpoint_url, enabled, revoked_at, rotated_at, created_at, updated_at").eq("workspace_id", auth.workspaceId).order("created_at", { ascending: false }).limit(100);
  if (result.error) return NextResponse.json({ error: "Could not load alert destinations." }, { status: 500 });
  return NextResponse.json({ data: result.data || [] });
}

export async function POST(request: Request) {
  const auth = await authenticateAlertRequest(request);
  if (!isAuthResult(auth)) return auth.response;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  const destination = parseDestination(body);
  if ("error" in destination) return NextResponse.json(destination, { status: 400 });
  const result = await auth.admin.from("trackmcp_alert_destinations").insert({ workspace_id: auth.workspaceId, ...destination }).select("id, workspace_id, kind, endpoint_url, enabled, revoked_at, rotated_at, created_at, updated_at").single();
  if (result.error || !result.data) return NextResponse.json({ error: "Could not create alert destination." }, { status: 500 });
  return NextResponse.json(result.data, { status: 201 });
}
