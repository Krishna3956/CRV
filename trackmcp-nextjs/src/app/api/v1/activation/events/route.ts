import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/auth/supabase-server";
import { getSupabaseAdmin } from "@/lib/repository/supabase";
import { consumeRateLimit } from "@/lib/cli/rate-limit";

const EVENT_TYPES = new Set(["signup_completed", "workspace_created", "api_key_created", "api_key_copied", "setup_snippet_copied", "first_event_check_started", "first_event_check_result", "first_telemetry_seen"]);
const SOURCES = new Set(["npm", "sdk_docs", "github", "ai", "direct", "device", "unknown"]);
const RESULTS = new Set(["event_found", "no_event", "unauthorized", "permission_denied", "retryable_error", "unknown"]);

export async function POST(request: Request) {
  const auth = await getSupabaseServer();
  const { data: authData, error: authError } = await auth.auth.getUser();
  if (authError || !authData.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!consumeRateLimit(`activation-event:${authData.user.id}`, 120, 60_000)) return NextResponse.json({ error: "Too many activation events." }, { status: 429 });
  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: "Activation events are not configured." }, { status: 503 });
  let body: Record<string, unknown>;
  try { const parsed = await request.json(); if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid"); body = parsed as Record<string, unknown>; } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  const eventId = typeof body.event_id === "string" ? body.event_id.trim() : "";
  const eventType = typeof body.event_type === "string" ? body.event_type : "";
  const source = typeof body.source === "string" ? body.source : "unknown";
  const workspaceId = typeof body.workspace_id === "string" ? body.workspace_id : null;
  if (!/^[A-Za-z0-9_-]{16,128}$/.test(eventId) || !EVENT_TYPES.has(eventType) || !SOURCES.has(source)) return NextResponse.json({ error: "Invalid activation event." }, { status: 400 });
  if (body.result_category !== undefined && (typeof body.result_category !== "string" || !RESULTS.has(body.result_category))) return NextResponse.json({ error: "Invalid activation result category." }, { status: 400 });
  if (workspaceId) {
    const membership = await admin.from("trackmcp_workspace_members").select("workspace_id").eq("workspace_id", workspaceId).eq("user_id", authData.user.id).maybeSingle();
    if (membership.error || !membership.data) return NextResponse.json({ error: "Workspace access denied." }, { status: 403 });
  }
  const inserted = await admin.from("trackmcp_activation_funnel_events").insert({
    event_id: eventId,
    event_type: eventType,
    source,
    package_name: typeof body.package_name === "string" ? body.package_name.slice(0, 128) : null,
    package_version: typeof body.package_version === "string" ? body.package_version.slice(0, 64) : null,
    content_path: typeof body.content_path === "string" ? body.content_path.slice(0, 256) : null,
    result_category: typeof body.result_category === "string" ? body.result_category : null,
    user_id: authData.user.id,
    workspace_id: workspaceId,
  });
  if (inserted.error && inserted.error.code !== "23505") return NextResponse.json({ error: "Could not record activation event." }, { status: 500 });
  return NextResponse.json({ recorded: true }, { status: 202 });
}
