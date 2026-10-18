import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/auth/supabase-server";
import { getSupabaseAdmin } from "@/lib/repository/supabase";
import { publicWorkspaceMemberships } from "@/lib/workspace-memberships";

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

  const result = await admin
    .from("trackmcp_workspace_members")
    .select("user_id, workspace_id, role, created_at, trackmcp_workspaces(id, name, slug)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });
  if (result.error) return NextResponse.json({ error: "Could not load your workspaces." }, { status: 500 });

  return NextResponse.json(
    { workspaces: publicWorkspaceMemberships(result.data, user.id) },
    { headers: { "cache-control": "no-store" } },
  );
}
