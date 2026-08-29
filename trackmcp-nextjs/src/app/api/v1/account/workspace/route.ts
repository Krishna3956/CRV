import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/auth/supabase-server";
import { getSupabaseAdmin } from "@/lib/repository/supabase";
import { createTrackMCPKey } from "@/lib/telemetry/keys";

async function getUser() {
  const auth = await getSupabaseServer();
  const { data, error } = await auth.auth.getUser();
  return error ? null : data.user;
}

export async function GET() {
  const user = await getUser();
  const admin = getSupabaseAdmin();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!admin) return NextResponse.json({ error: "Account service is not configured." }, { status: 503 });

  const { data: membership, error: membershipError } = await admin
    .from("trackmcp_workspace_members")
    .select("workspace_id, role, trackmcp_workspaces(id, name, slug)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (membershipError) return NextResponse.json({ error: "Could not load your workspace." }, { status: 500 });
  if (!membership) return NextResponse.json({ workspace: null, keys: [] });

  const { data: keys, error: keyError } = await admin
    .from("trackmcp_api_keys")
    .select("id, name, key_prefix, revoked_at, created_at")
    .eq("workspace_id", membership.workspace_id)
    .order("created_at", { ascending: false });
  if (keyError) return NextResponse.json({ error: "Could not load API keys." }, { status: 500 });
  return NextResponse.json({ workspace: membership.trackmcp_workspaces, role: membership.role, keys: keys || [] });
}

export async function POST(request: Request) {
  const user = await getUser();
  const admin = getSupabaseAdmin();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!admin) return NextResponse.json({ error: "Account service is not configured." }, { status: 503 });

  let body: { name?: string; slug?: string; key_name?: string; full_name?: string; first_name?: string; last_name?: string; company_name?: string; role?: string; use_case?: string; terms_accepted?: boolean } = {};
  try { body = await request.json(); } catch { /* defaults are fine */ }
  const existing = await admin.from("trackmcp_workspace_members").select("workspace_id").eq("user_id", user.id).limit(1).maybeSingle();
  if (existing.error) return NextResponse.json({ error: "Could not check your workspace." }, { status: 500 });

  const profile = await admin.from("trackmcp_profiles").upsert({
    user_id: user.id,
    first_name: body.first_name?.trim() || user.user_metadata?.first_name || null,
    last_name: body.last_name?.trim() || user.user_metadata?.last_name || null,
    full_name: body.full_name?.trim() || [body.first_name, body.last_name].filter(Boolean).join(" ").trim() || user.user_metadata?.full_name || null,
    company_name: body.company_name?.trim() || null,
    role: body.role?.trim() || null,
    use_case: body.use_case?.trim() || null,
    terms_accepted_at: body.terms_accepted ? new Date().toISOString() : null,
    onboarding_completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
  if (profile.error) return NextResponse.json({ error: "Could not save your onboarding details." }, { status: 500 });

  let workspaceId = existing.data?.workspace_id;
  let workspace: { id: string; name: string; slug: string } | null = null;
  if (!workspaceId) {
    const emailName = user.email?.split("@")[0] || "your workspace";
    const name = body.name?.trim() || `${emailName} workspace`;
    const slug = body.slug?.trim().toLowerCase() || `workspace-${user.id.slice(0, 8)}`;
    const created = await admin.from("trackmcp_workspaces").insert({ name, slug }).select("id, name, slug").single();
    if (created.error || !created.data) return NextResponse.json({ error: "Could not create your workspace." }, { status: created.error?.code === "23505" ? 409 : 500 });
    workspace = created.data;
    workspaceId = workspace.id;
    const membership = await admin.from("trackmcp_workspace_members").insert({ workspace_id: workspaceId, user_id: user.id, role: "owner" });
    if (membership.error) {
      await admin.from("trackmcp_workspaces").delete().eq("id", workspaceId);
      return NextResponse.json({ error: "Could not connect your workspace." }, { status: 500 });
    }
  } else {
    const loaded = await admin.from("trackmcp_workspaces").select("id, name, slug").eq("id", workspaceId).single();
    workspace = loaded.data;
  }

  const generated = createTrackMCPKey();
  const createdKey = await admin.from("trackmcp_api_keys").insert({ workspace_id: workspaceId, name: body.key_name?.trim() || "default", key_prefix: generated.prefix, key_hash: generated.hash });
  if (createdKey.error) return NextResponse.json({ error: "Could not create your API key." }, { status: 500 });
  return NextResponse.json({ workspace, api_key: generated.key, message: "Copy this key now. It will not be shown again." }, { status: 201 });
}
