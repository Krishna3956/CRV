import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/auth/supabase-server";
import { getSupabaseAdmin } from "@/lib/repository/supabase";
import { createTrackMCPKey } from "@/lib/telemetry/keys";
import { publicWorkspaceMemberships } from "@/lib/workspace-memberships";

async function getUser() {
  const auth = await getSupabaseServer();
  const { data, error } = await auth.auth.getUser();
  return error ? null : data.user;
}

const MAX_WORKSPACE_BODY_BYTES = 8192;
const boundedText = (value: unknown, max: number): string =>
  typeof value === "string" ? value.trim().slice(0, max) : "";
const boundedScope = (value: unknown, max: number): string | null => {
  const normalized = boundedText(value, max);
  return normalized && !/[\u0000-\u001f\u007f]/.test(normalized) ? normalized : null;
};

export async function GET(request: Request) {
  const user = await getUser();
  const admin = getSupabaseAdmin();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!admin) return NextResponse.json({ error: "Account service is not configured." }, { status: 503 });

  const { data: memberships, error: membershipError } = await admin
    .from("trackmcp_workspace_members")
    .select("user_id, workspace_id, role, trackmcp_workspaces(id, name, slug)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });
  if (membershipError) return NextResponse.json({ error: "Could not load your workspace." }, { status: 500 });
  const workspaces = publicWorkspaceMemberships(memberships || [], user.id);
  const requestedWorkspaceId = new URL(request.url).searchParams.get("workspace_id")?.trim() || "";
  if (requestedWorkspaceId.length > 128) return NextResponse.json({ error: "workspace_id is invalid." }, { status: 400 });
  const workspace = requestedWorkspaceId
    ? workspaces.find((candidate) => candidate.id === requestedWorkspaceId) || null
    : workspaces[0] || null;
  if (requestedWorkspaceId && !workspace) return NextResponse.json({ error: "You do not have access to that workspace." }, { status: 404 });
  if (!workspace) return NextResponse.json({ workspace: null, workspaces: [], keys: [] }, { headers: { "cache-control": "no-store" } });
  const membership = (memberships || []).find((candidate: { workspace_id?: unknown }) => candidate.workspace_id === workspace.id) as { role?: unknown } | undefined;

  let { data: keys, error: keyError } = await admin
    .from("trackmcp_api_keys")
    .select("id, name, key_prefix, service_scope, environment_scope, revoked_at, created_at, last_used_at")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false });
  // The column is additive and may not be visible to PostgREST during a
  // rolling migration. Keep Setup usable with an explicit null usage state
  // until the schema cache catches up; unrelated database errors still fail
  // closed rather than being hidden.
  if (keyError && /column|schema cache|does not exist/i.test(keyError.message || "")) {
    const fallback = await admin
      .from("trackmcp_api_keys")
      .select("id, name, key_prefix, service_scope, environment_scope, revoked_at, created_at")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false });
    keyError = fallback.error;
    keys = (fallback.data || []).map((key: Record<string, unknown>) => ({ ...key, last_used_at: null })) as typeof keys;
  }
  if (keyError) return NextResponse.json({ error: "Could not load API keys." }, { status: 500 });
  return NextResponse.json({ workspace, workspaces, role: membership?.role || null, keys: keys || [] }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request) {
  const user = await getUser();
  const admin = getSupabaseAdmin();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!admin) return NextResponse.json({ error: "Account service is not configured." }, { status: 503 });

  let body: { name?: unknown; slug?: unknown; key_name?: unknown; service_scope?: unknown; environment_scope?: unknown; workspace_id?: unknown; create_key?: unknown; full_name?: unknown; first_name?: unknown; last_name?: unknown; company_name?: unknown; role?: unknown; use_case?: unknown; terms_accepted?: unknown } = {};
  try {
    const raw = await request.arrayBuffer();
    if (raw.byteLength > MAX_WORKSPACE_BODY_BYTES) return NextResponse.json({ error: "Request body is too large." }, { status: 413 });
    const parsed: unknown = JSON.parse(new TextDecoder().decode(raw));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return NextResponse.json({ error: "JSON body must be an object." }, { status: 400 });
    body = parsed as typeof body;
  } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  let serviceScope: string | null = null;
  let environmentScope: string | null = null;
  if (body.create_key !== false) {
    const rawServiceScope = typeof body.service_scope === "string" ? body.service_scope.trim() : "";
    const rawEnvironmentScope = typeof body.environment_scope === "string" ? body.environment_scope.trim() : "";
    if (rawServiceScope.length > 100 || rawEnvironmentScope.length > 64) return NextResponse.json({ error: "Key scope is too long." }, { status: 400 });
    serviceScope = boundedScope(rawServiceScope, 100);
    environmentScope = boundedScope(rawEnvironmentScope, 64);
    if ((body.service_scope !== undefined && serviceScope === null && rawServiceScope) || (body.environment_scope !== undefined && environmentScope === null && rawEnvironmentScope)) {
      return NextResponse.json({ error: "Key scope contains invalid control characters." }, { status: 400 });
    }
  }
  const membershipsResult = await admin.from("trackmcp_workspace_members").select("workspace_id").eq("user_id", user.id);
  if (membershipsResult.error) return NextResponse.json({ error: "Could not check your workspace." }, { status: 500 });
  const memberships = (membershipsResult.data || []) as Array<{ workspace_id: string }>;
  const rawWorkspaceId = typeof body.workspace_id === "string" ? body.workspace_id.trim() : "";
  if (rawWorkspaceId.length > 128) return NextResponse.json({ error: "workspace_id is invalid." }, { status: 400 });
  const requestedWorkspaceId = rawWorkspaceId;
  if (requestedWorkspaceId && !memberships.some((membership) => membership.workspace_id === requestedWorkspaceId)) return NextResponse.json({ error: "You do not have access to that workspace." }, { status: 404 });
  if (!requestedWorkspaceId && memberships.length > 1) return NextResponse.json({ error: "workspace_id is required when you belong to multiple workspaces." }, { status: 400 });

  const profile = await admin.from("trackmcp_profiles").upsert({
    user_id: user.id,
    first_name: boundedText(body.first_name, 120) || user.user_metadata?.first_name || null,
    last_name: boundedText(body.last_name, 120) || user.user_metadata?.last_name || null,
    full_name: boundedText(body.full_name, 200) || [boundedText(body.first_name, 120), boundedText(body.last_name, 120)].filter(Boolean).join(" ").trim() || user.user_metadata?.full_name || null,
    company_name: boundedText(body.company_name, 200) || null,
    role: boundedText(body.role, 120) || null,
    use_case: boundedText(body.use_case, 1000) || null,
    terms_accepted_at: body.terms_accepted === true ? new Date().toISOString() : null,
    onboarding_completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
  if (profile.error) return NextResponse.json({ error: "Could not save your onboarding details." }, { status: 500 });

  let workspaceId = requestedWorkspaceId || memberships[0]?.workspace_id;
  let workspace: { id: string; name: string; slug: string } | null = null;
  if (!workspaceId) {
    const emailName = user.email?.split("@")[0] || "your workspace";
    const name = boundedText(body.name, 160) || `${emailName} workspace`;
    const slug = boundedText(body.slug, 120).toLowerCase() || `workspace-${user.id.slice(0, 8)}`;
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

  if (body.create_key !== false) {
    const generated = createTrackMCPKey();
    const createdKey = await admin.from("trackmcp_api_keys").insert({ workspace_id: workspaceId, name: boundedText(body.key_name, 128) || "default", service_scope: serviceScope, environment_scope: environmentScope, key_prefix: generated.prefix, key_hash: generated.hash });
    if (createdKey.error) return NextResponse.json({ error: "Could not create your API key." }, { status: 500 });
    return NextResponse.json({ workspace, api_key: generated.key, message: "Copy this key now. It will not be shown again." }, { status: 201, headers: { "cache-control": "no-store" } });
  }
  return NextResponse.json({ workspace, api_key: null, message: "Workspace created. Create a connection key from Setup when you are ready." }, { status: 201, headers: { "cache-control": "no-store" } });
}
