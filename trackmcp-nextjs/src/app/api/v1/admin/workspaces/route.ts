import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/repository/supabase";
import { createTrackMCPKey } from "@/lib/telemetry/keys";

export async function POST(req: Request) {
  const adminKey = process.env.TRACKMCP_ADMIN_KEY;
  const providedKey = req.headers.get("x-trackmcp-admin-key") || "";
  const expectedBytes = adminKey ? Buffer.from(adminKey, "utf8") : Buffer.alloc(0);
  const providedBytes = Buffer.from(providedKey, "utf8");
  const authorized = Boolean(adminKey)
    && expectedBytes.length === providedBytes.length
    && timingSafeEqual(expectedBytes, providedBytes);
  if (!authorized) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Admin service is not configured." }, { status: 503 });

  let body: { name?: string; slug?: string; key_name?: string };
  try {
    const raw = await req.arrayBuffer();
    if (raw.byteLength > 4096) return NextResponse.json({ error: "Request is too large." }, { status: 413 });
    const parsed = JSON.parse(new TextDecoder().decode(raw));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
    body = parsed as { name?: string; slug?: string; key_name?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const name = body.name?.trim();
  const slug = body.slug?.trim().toLowerCase();
  const keyName = body.key_name?.trim() || "default";
  if (!name || name.length > 128 || !slug || slug.length > 64 || !/^[a-z0-9-]+$/.test(slug) || keyName.length > 128) {
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
    name: keyName,
    key_prefix: generated.prefix,
    key_hash: generated.hash,
  });
  if (keyError) {
    await supabase.from("trackmcp_workspaces").delete().eq("id", workspace.id);
    console.error("API key creation failed", keyError);
    return NextResponse.json({ error: "Could not create workspace key." }, { status: 500 });
  }

  return NextResponse.json({ workspace, api_key: generated.key }, { headers: { "cache-control": "no-store" } });
}
