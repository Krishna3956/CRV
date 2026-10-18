import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/repository/supabase";
import { lookupCliKey } from "@/lib/cli/key-status";
import { consumeRateLimit } from "@/lib/cli/rate-limit";
import { hashDeviceCode } from "@/lib/cli/device-auth";

export async function GET(request: Request) {
  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: "Key status service is not configured." }, { status: 503 });
  const authorization = request.headers.get("authorization") || "";
  if (!consumeRateLimit(`key-status:${hashDeviceCode(authorization)}`, 30, 60_000)) return NextResponse.json({ error: "Too many verification attempts. Try again shortly." }, { status: 429, headers: { "retry-after": "60" } });
  const lookup = await lookupCliKey(admin, authorization);
  if (lookup.error === "lookup_failed") return NextResponse.json({ error: "Could not verify key." }, { status: 503 });
  if (!lookup.key) return NextResponse.json({ status: "invalid", workspace_available: false, service_available: true }, { status: 401 });
  if (lookup.key.revoked_at) return NextResponse.json({ status: "revoked", workspace_available: false, service_available: true }, { status: 401 });
  const workspace = await admin.from("trackmcp_workspaces").select("id").eq("id", lookup.key.workspace_id).maybeSingle();
  return NextResponse.json({ status: "valid", workspace_available: Boolean(workspace.data), service_available: !workspace.error }, { headers: { "cache-control": "no-store" } });
}
