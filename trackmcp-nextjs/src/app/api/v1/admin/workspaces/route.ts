import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/repository/supabase";
import { createTrackMCPKey } from "@/lib/telemetry/keys";

export async function POST(req: Request) {
  const adminKey = process.env.TRACKMCP_ADMIN_KEY;
  if (!adminKey || req.headers.get("x-trackmcp-admin-key") !== adminKey) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Admin service is not configured." }, { status: 503 });

  let body: { name?: string; slug?: string; key_name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const name = body.name?.trim();
  const slug = body.slug?.trim().toLowerCase();
  if (!name || !slug || !/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: "name and a slug using letters, numbers, and hyphens are required." }, { status: 400 });
  }

  const { data: workspace, error: workspaceError } = await supabase
    .from("trackmcp_workspaces")
    .insert({ name, slug })
    .select("id, name, slug")
    .single();
  if (workspaceError) {
    if (workspaceError.code === "23505") return NextResponse.json({ error: "That workspace slug already exists." }, { status: 409 });
    console.error("Workspace creation failed", workspaceError);
    return NextResponse.json({ error: "Could not create workspace." }, { status: 500 });
  }

  const generated = createTrackMCPKey();
  const { error: keyError } = await supabase.from("trackmcp_api_keys").insert({
    workspace_id: workspace.id,
    name: body.key_name?.trim() || "default",
    key_prefix: generated.prefix,
    key_hash: generated.hash,
  });
  if (keyError) {
    await supabase.from("trackmcp_workspaces").delete().eq("id", workspace.id);
    console.error("API key creation failed", keyError);
    return NextResponse.json({ error: "Could not create workspace key." }, { status: 500 });
  }

  return NextResponse.json({ workspace, api_key: generated.key });
}
