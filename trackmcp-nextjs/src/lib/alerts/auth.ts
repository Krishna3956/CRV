import { getSupabaseServer } from "../auth/supabase-server.ts";
import { getSupabaseAdmin } from "../repository/supabase.ts";
import { hashTrackMCPKey } from "../telemetry/keys.ts";

export type AlertAuth = {
  admin: NonNullable<ReturnType<typeof getSupabaseAdmin>>;
  workspaceId: string;
  /** API keys authenticate ingestion, but never authorize human review actions. */
  actorId: string | null;
  canManageActionQueue: boolean;
};

export async function authenticateAlertRequest(request: Request, getAdmin: typeof getSupabaseAdmin = getSupabaseAdmin, getServer: typeof getSupabaseServer = getSupabaseServer): Promise<AlertAuth | { response: Response }> {
  const admin = getAdmin();
  if (!admin) return { response: Response.json({ error: "Alert service is not configured." }, { status: 503 }) };
  const authorization = request.headers.get("authorization") || "";
  const apiKey = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (apiKey) {
    const result = await admin.from("trackmcp_api_keys").select("workspace_id, revoked_at").eq("key_hash", hashTrackMCPKey(apiKey)).maybeSingle();
    if (result.error) return { response: Response.json({ error: "Could not authenticate alert request." }, { status: 500 }) };
    if (!result.data || result.data.revoked_at) return { response: Response.json({ error: "Invalid or revoked API key." }, { status: 401 }) };
    return { admin, workspaceId: result.data.workspace_id, actorId: null, canManageActionQueue: false };
  }
  const auth = await getServer();
  const user = await auth.auth.getUser();
  if (!user.data.user) return { response: Response.json({ error: "Sign in or provide a workspace API key." }, { status: 401 }) };
  const requestedWorkspaceId = new URL(request.url).searchParams.get("workspace_id")?.trim() || "";
  if (!requestedWorkspaceId || requestedWorkspaceId.length > 128) return { response: Response.json({ error: "workspace_id is required." }, { status: 400 }) };
  const membershipQuery = admin.from("trackmcp_workspace_members").select("workspace_id, role").eq("user_id", user.data.user.id);
  if (requestedWorkspaceId) membershipQuery.eq("workspace_id", requestedWorkspaceId);
  const membership = await membershipQuery.limit(1).maybeSingle();
  if (membership.error) return { response: Response.json({ error: "Could not authenticate dashboard request." }, { status: 500 }) };
  if (!membership.data) return { response: Response.json({ error: requestedWorkspaceId ? "You do not have access to that workspace." : "Create a workspace first." }, { status: 404 }) };
  const role = typeof membership.data.role === "string" ? membership.data.role.toLowerCase() : "";
  return {
    admin,
    workspaceId: membership.data.workspace_id,
    actorId: user.data.user.id,
    canManageActionQueue: role === "owner" || role === "admin",
  };
}

export function isAuthResult(value: AlertAuth | { response: Response }): value is AlertAuth {
  return "admin" in value;
}
