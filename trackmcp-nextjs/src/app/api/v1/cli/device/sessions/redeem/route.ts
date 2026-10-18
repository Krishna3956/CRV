import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/repository/supabase";
import { createDeterministicTrackMCPKey } from "@/lib/telemetry/keys";
import { hashDeviceCode, isExpired, normalizeBounded } from "@/lib/cli/device-auth";

export async function POST(request: Request) {
  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: "Device authorization is not configured." }, { status: 503 });
  let body: { device_code?: unknown; redemption_id?: unknown; key_name?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }
  const deviceCode = typeof body.device_code === "string" ? body.device_code : "";
  if (deviceCode.length < 32 || deviceCode.length > 128) return NextResponse.json({ error: "Invalid device code." }, { status: 400 });
  const redemptionId = typeof body.redemption_id === "string" && body.redemption_id.length >= 16 && body.redemption_id.length <= 128 ? body.redemption_id : "";
  const lookup = await admin.from("trackmcp_cli_device_sessions").select("id, status, expires_at, approved_user_id, approved_workspace_id, created_key_id, redemption_id_hash").eq("device_code_hash", hashDeviceCode(deviceCode)).maybeSingle();
  if (lookup.error || !lookup.data) return NextResponse.json({ error: "Invalid or expired device session." }, { status: 400 });
  const session = lookup.data as { id: string; status: string; expires_at: string; approved_user_id: string | null; approved_workspace_id: string | null; created_key_id: string | null; redemption_id_hash: string | null };
  // The fallback keeps older clients compatible. New clients should supply a
  // random redemption_id so a lost response can be safely retried.
  const effectiveRedemptionId = redemptionId || `legacy:${session.id}`;
  const redemptionHash = hashDeviceCode(effectiveRedemptionId);
  const existingRedemptionMatches = session.redemption_id_hash === redemptionHash;
  if (session.status === "redeemed" && (!existingRedemptionMatches || !session.created_key_id)) return NextResponse.json({ status: "already_redeemed", message: "This device session has already been redeemed." }, { status: 409 });
  if (session.status === "redeemed" && session.created_key_id) {
    const generated = createDeterministicTrackMCPKey(session.id, effectiveRedemptionId);
    if (!generated) return NextResponse.json({ error: "Device key recovery is not configured." }, { status: 503 });
    const workspace = await admin.from("trackmcp_workspaces").select("id, name, slug").eq("id", session.approved_workspace_id).single();
    if (workspace.error || !workspace.data) return NextResponse.json({ error: "Workspace is unavailable." }, { status: 500 });
    return NextResponse.json({ status: "redeemed", workspace: workspace.data, api_key: generated.key, message: "Copy or store this key now. It will not be shown again." }, { headers: { "cache-control": "no-store" } });
  }
  if (session.status === "redeeming" && !existingRedemptionMatches) return NextResponse.json({ status: "already_redeemed", message: "This device session is being redeemed." }, { status: 409 });
  if (isExpired(session.expires_at)) {
    await admin.from("trackmcp_cli_device_sessions").update({ status: "expired" }).eq("id", session.id).in("status", ["pending", "approved"]);
    return NextResponse.json({ status: "expired" }, { status: 410 });
  }
  if (session.status !== "approved" || !session.approved_user_id || !session.approved_workspace_id) return NextResponse.json({ status: session.status === "denied" ? "denied" : "authorization_pending" });
  if (session.status === "approved") {
    const claimed = await admin.from("trackmcp_cli_device_sessions").update({ status: "redeeming", redeemed_at: new Date().toISOString(), redemption_id_hash: redemptionHash }).eq("id", session.id).eq("status", "approved").select("id").maybeSingle();
    if (claimed.error || !claimed.data) return NextResponse.json({ status: "already_redeemed", message: "This device session is already being redeemed." }, { status: 409 });
  }
  const generated = createDeterministicTrackMCPKey(session.id, effectiveRedemptionId);
  if (!generated) return NextResponse.json({ error: "Device key creation is not configured." }, { status: 503 });
  let created = await admin.from("trackmcp_api_keys").select("id").eq("key_hash", generated.hash).maybeSingle();
  if (created.error) return NextResponse.json({ error: "Could not verify connection key creation." }, { status: 503 });
  if (!created.data) {
    const inserted = await admin.from("trackmcp_api_keys").insert({ workspace_id: session.approved_workspace_id, name: normalizeBounded(body.key_name, 128, "cli-init"), key_prefix: generated.prefix, key_hash: generated.hash }).select("id").maybeSingle();
    if (inserted.error && inserted.error.code !== "23505") {
      await admin.from("trackmcp_cli_device_sessions").update({ status: "approved", redeemed_at: null, redemption_id_hash: null }).eq("id", session.id).eq("status", "redeeming").is("created_key_id", null);
      return NextResponse.json({ error: "Could not create the connection key." }, { status: 500 });
    }
    created = inserted.error ? await admin.from("trackmcp_api_keys").select("id").eq("key_hash", generated.hash).maybeSingle() : inserted;
  }
  if (created.error || !created.data) return NextResponse.json({ error: "Could not recover the connection key." }, { status: 503 });
  const finalized = await admin.from("trackmcp_cli_device_sessions").update({ status: "redeemed", created_key_id: created.data.id }).eq("id", session.id).eq("status", "redeeming").is("created_key_id", null);
  if (finalized.error) return NextResponse.json({ error: "Could not finalize device authorization; retry with the same redemption id." }, { status: 503 });
  const workspace = await admin.from("trackmcp_workspaces").select("id, name, slug").eq("id", session.approved_workspace_id).single();
  if (workspace.error || !workspace.data) return NextResponse.json({ error: "Workspace is unavailable." }, { status: 500 });
  return NextResponse.json({ workspace: workspace.data, api_key: generated.key, message: "Copy or store this key now. It will not be shown again." }, { status: 201, headers: { "cache-control": "no-store" } });
}
