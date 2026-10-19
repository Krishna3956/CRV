import { NextResponse } from "next/server.js";
import { getSupabaseServer } from "../../../../../../../lib/auth/supabase-server.ts";
import { getSupabaseAdmin } from "../../../../../../../lib/repository/supabase.ts";
import { hashDeviceCode, isExpired, readBoundedJsonObject } from "../../../../../../../lib/cli/device-auth.ts";

type User = { id: string };
type Admin = ReturnType<typeof getSupabaseAdmin>;

async function currentUser(): Promise<User | null> {
  const auth = await getSupabaseServer();
  const { data, error } = await auth.auth.getUser();
  return error ? null : data.user;
}

/** Browser approval handler. It approves only the device session; redemption remains CLI-only. */
export function createApproveHandler(
  getUser: () => Promise<User | null> = currentUser,
  getAdmin: () => Admin = getSupabaseAdmin,
) {
  return async function POST(request: Request) {
    const [user, admin] = await Promise.all([getUser(), Promise.resolve(getAdmin())]);
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    if (!admin) return NextResponse.json({ error: "Device authorization is not configured." }, { status: 503 });
    const parsed = await readBoundedJsonObject(request);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    const body = parsed.value;
    const userCode = typeof body.user_code === "string" ? body.user_code.trim().toUpperCase() : "";
    const workspaceId = typeof body.workspace_id === "string" ? body.workspace_id.trim() : "";
    if (!/^[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(userCode) || !/^[0-9a-f-]{36}$/i.test(workspaceId)) {
      return NextResponse.json({ error: "Invalid device approval request." }, { status: 400 });
    }
    const membership = await admin.from("trackmcp_workspace_members").select("workspace_id").eq("workspace_id", workspaceId).eq("user_id", user.id).maybeSingle();
    if (membership.error || !membership.data) return NextResponse.json({ error: "Workspace access denied." }, { status: 403 });
    const sessionResult = await admin.from("trackmcp_cli_device_sessions").select("id, status, expires_at").eq("user_code_hash", hashDeviceCode(userCode)).maybeSingle();
    const session = sessionResult.data as { id: string; status: string; expires_at: string } | null;
    if (sessionResult.error || !session) return NextResponse.json({ error: "Device session not found." }, { status: 404 });
    if (isExpired(session.expires_at)) {
      await admin.from("trackmcp_cli_device_sessions").update({ status: "expired" }).eq("id", session.id).in("status", ["pending", "approved"]);
      return NextResponse.json({ status: "expired" }, { status: 410 });
    }
    if (session.status === "approved") return NextResponse.json({ status: "already_approved" }, { headers: { "cache-control": "no-store" } });
    if (session.status === "redeeming" || session.status === "redeemed") return NextResponse.json({ status: "already_redeemed" }, { status: 409, headers: { "cache-control": "no-store" } });
    if (session.status === "denied") return NextResponse.json({ status: "denied", reason_category: "user_denied" }, { status: 403, headers: { "cache-control": "no-store" } });
    if (session.status !== "pending") return NextResponse.json({ status: "invalid" }, { status: 404, headers: { "cache-control": "no-store" } });
    const approved = await admin.from("trackmcp_cli_device_sessions").update({ status: "approved", approved_user_id: user.id, approved_workspace_id: workspaceId }).eq("id", session.id).eq("status", "pending");
    if (approved.error) return NextResponse.json({ error: "Could not approve device session." }, { status: 500 });
    return NextResponse.json({ status: "approved" }, { headers: { "cache-control": "no-store" } });
  };
}

