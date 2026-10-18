import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/auth/supabase-server";
import { getSupabaseAdmin } from "@/lib/repository/supabase";
import { hashDeviceCode, isExpired } from "@/lib/cli/device-auth";

async function currentUser() {
  const auth = await getSupabaseServer();
  const { data, error } = await auth.auth.getUser();
  return error ? null : data.user;
}

export async function POST(request: Request) {
  const [user, admin] = await Promise.all([currentUser(), Promise.resolve(getSupabaseAdmin())]);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!admin) return NextResponse.json({ error: "Device authorization is not configured." }, { status: 503 });
  let body: { user_code?: unknown; workspace_id?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  const userCode = typeof body.user_code === "string" ? body.user_code.trim().toUpperCase() : "";
  const workspaceId = typeof body.workspace_id === "string" ? body.workspace_id.trim() : "";
  if (!/^[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(userCode) || !/^[0-9a-f-]{36}$/i.test(workspaceId)) {
    return NextResponse.json({ status: "invalid" }, { status: 400 });
  }
  const sessionResult = await admin.from("trackmcp_cli_device_sessions").select("id, status, expires_at").eq("user_code_hash", hashDeviceCode(userCode)).maybeSingle();
  const session = sessionResult.data as { id: string; status: string; expires_at: string } | null;
  if (sessionResult.error || !session) return NextResponse.json({ status: "invalid" }, { status: 404 });
  if (isExpired(session.expires_at)) {
    await admin.from("trackmcp_cli_device_sessions").update({ status: "expired" }).eq("id", session.id).in("status", ["pending", "approved"]);
    return NextResponse.json({ status: "expired" }, { status: 410 });
  }
  if (session.status === "approved") return NextResponse.json({ status: "already_approved" });
  if (session.status === "redeeming" || session.status === "redeemed") return NextResponse.json({ status: "already_redeemed" }, { status: 409 });
  if (session.status === "denied") return NextResponse.json({ status: "denied", reason_category: "user_denied" }, { status: 409 });
  if (session.status !== "pending") return NextResponse.json({ status: "invalid" }, { status: 409 });
  const membership = await admin.from("trackmcp_workspace_members").select("workspace_id").eq("workspace_id", workspaceId).eq("user_id", user.id).maybeSingle();
  if (membership.error || !membership.data) return NextResponse.json({ status: "denied", reason_category: "user_denied" }, { status: 403 });
  const approved = await admin.from("trackmcp_cli_device_sessions").update({ status: "approved", approved_user_id: user.id, approved_workspace_id: workspaceId }).eq("id", session.id).eq("status", "pending");
  if (approved.error) return NextResponse.json({ error: "Could not approve device session." }, { status: 500 });
  const refreshed = await admin.from("trackmcp_cli_device_sessions").select("status").eq("id", session.id).maybeSingle();
  if (refreshed.data?.status === "redeemed" || refreshed.data?.status === "redeeming") return NextResponse.json({ status: "already_redeemed" }, { status: 409 });
  if (refreshed.data?.status === "approved") return NextResponse.json({ status: "approved" });
  return NextResponse.json({ status: "invalid" }, { status: 409 });
}
