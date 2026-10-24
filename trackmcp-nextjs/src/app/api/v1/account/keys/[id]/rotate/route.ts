import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/auth/supabase-server";
import { getSupabaseAdmin } from "@/lib/repository/supabase";
import { createTrackMCPKey } from "@/lib/telemetry/keys";

const boundedText = (value: unknown, max: number): string =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

/**
 * Rotate a workspace connection key without ever returning the old secret.
 * The replacement inherits the old service/environment scope and is shown
 * once. The old key is revoked before the response is returned; if that
 * second write fails, the newly inserted key is removed as a best-effort
 * rollback so a partial rotation cannot silently leave two active secrets.
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await getSupabaseServer();
  const { data: userData } = await auth.auth.getUser();
  const admin = getSupabaseAdmin();
  if (!userData.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!admin) return NextResponse.json({ error: "Account service is not configured." }, { status: 503 });

  const { id } = await context.params;
  const workspaceId = new URL(request.url).searchParams.get("workspace_id")?.trim() || "";
  if (!workspaceId || workspaceId.length > 128) return NextResponse.json({ error: "workspace_id is required." }, { status: 400 });
  if (!id || id.length > 128) return NextResponse.json({ error: "API key id is required." }, { status: 400 });

  const membership = await admin
    .from("trackmcp_workspace_members")
    .select("workspace_id, role")
    .eq("user_id", userData.user.id)
    .eq("workspace_id", workspaceId)
    .in("role", ["owner", "admin"])
    .maybeSingle();
  if (membership.error || !membership.data) return NextResponse.json({ error: "Workspace not found." }, { status: 404 });

  const existing = await admin
    .from("trackmcp_api_keys")
    .select("id, name, service_scope, environment_scope, revoked_at")
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (existing.error) return NextResponse.json({ error: "Could not load API key." }, { status: 500 });
  if (!existing.data || existing.data.revoked_at) return NextResponse.json({ error: "Active API key not found." }, { status: 404 });

  const generated = createTrackMCPKey();
  const replacementName = boundedText(existing.data.name, 128) || "connection key";
  const inserted = await admin
    .from("trackmcp_api_keys")
    .insert({
      workspace_id: workspaceId,
      name: `${replacementName} (rotated)`.slice(0, 128),
      service_scope: existing.data.service_scope || null,
      environment_scope: existing.data.environment_scope || null,
      key_prefix: generated.prefix,
      key_hash: generated.hash,
    })
    .select("id, name, key_prefix, service_scope, environment_scope, created_at")
    .single();
  if (inserted.error || !inserted.data) return NextResponse.json({ error: "Could not create replacement API key." }, { status: 500 });

  const revoked = await admin
    .from("trackmcp_api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .is("revoked_at", null)
    .select("id")
    .maybeSingle();
  if (revoked.error || !revoked.data) {
    await admin.from("trackmcp_api_keys").delete().eq("id", inserted.data.id).eq("workspace_id", workspaceId);
    return NextResponse.json({ error: "Could not complete API key rotation." }, { status: 409 });
  }

  return NextResponse.json({
    rotated: true,
    revoked_key_id: id,
    key: inserted.data,
    api_key: generated.key,
    message: "Copy this replacement key now. It will not be shown again.",
  }, { status: 201, headers: { "cache-control": "no-store" } });
}
