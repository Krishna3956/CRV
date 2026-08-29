import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/auth/supabase-server";
import { getSupabaseAdmin } from "@/lib/repository/supabase";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await getSupabaseServer();
  const { data: userData } = await auth.auth.getUser();
  const admin = getSupabaseAdmin();
  if (!userData.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!admin) return NextResponse.json({ error: "Account service is not configured." }, { status: 503 });
  const { id } = await context.params;
  const membership = await admin.from("trackmcp_workspace_members").select("workspace_id").eq("user_id", userData.user.id).limit(1).maybeSingle();
  if (membership.error || !membership.data) return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  const { error } = await admin.from("trackmcp_api_keys").update({ revoked_at: new Date().toISOString() }).eq("id", id).eq("workspace_id", membership.data.workspace_id).is("revoked_at", null);
  if (error) return NextResponse.json({ error: "Could not revoke API key." }, { status: 500 });
  return NextResponse.json({ revoked: true });
}
