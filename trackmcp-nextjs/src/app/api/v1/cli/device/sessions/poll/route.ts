import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/repository/supabase";
import {
  DEVICE_MAX_POLLS,
  DEVICE_POLL_INTERVAL_SECONDS,
  DEVICE_POLL_MIN_INTERVAL_MS,
  DEVICE_SLOW_POLL_INTERVAL_SECONDS,
  hashDeviceCode,
  isExpired,
  readBoundedJsonObject,
} from "@/lib/cli/device-auth";
import { consumeRateLimitDetailedAsync, rateLimitHeaders } from "@/lib/cli/rate-limit";

export async function POST(request: Request) {
  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: "Device authorization is not configured." }, { status: 503 });
  const parsed = await readBoundedJsonObject(request);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  const body = parsed.value;
  const deviceCode = typeof body.device_code === "string" ? body.device_code : "";
  if (deviceCode.length < 32 || deviceCode.length > 128) return NextResponse.json({ error: "Invalid device code." }, { status: 400 });
  const decision = await consumeRateLimitDetailedAsync({ key: `device-poll:${hashDeviceCode(deviceCode)}`, limit: 120, windowMs: 10 * 60_000 });
  if (!decision.allowed) return NextResponse.json({ error: "Too many polling attempts." }, { status: 429, headers: rateLimitHeaders(decision) });
  const result = await admin.from("trackmcp_cli_device_sessions").select("id, status, expires_at, last_polled_at, poll_count, last_slow_down_at").eq("device_code_hash", hashDeviceCode(deviceCode)).maybeSingle();
  if (result.error || !result.data) return NextResponse.json({ error: "Invalid or expired device session." }, { status: 400 });
  const session = result.data as { id: string; status: string; expires_at: string; last_polled_at: string | null; poll_count: number; last_slow_down_at: string | null };
  if (isExpired(session.expires_at) && ["pending", "approved"].includes(session.status)) {
    await admin.from("trackmcp_cli_device_sessions").update({ status: "expired" }).eq("id", session.id).in("status", ["pending", "approved"]);
    return NextResponse.json({ status: "expired" }, { status: 410 });
  }
  if (session.status === "denied" || session.status === "expired") return NextResponse.json({ status: session.status });
  if (session.status === "redeeming" || session.status === "redeemed") return NextResponse.json({ status: "approved" });
  if (session.poll_count >= DEVICE_MAX_POLLS) {
    await admin.from("trackmcp_cli_device_sessions").update({ status: "expired" }).eq("id", session.id).in("status", ["pending", "approved"]);
    return NextResponse.json({ status: "expired" }, { status: 410 });
  }
  const now = Date.now();
  const lastPolled = session.last_polled_at ? new Date(session.last_polled_at).getTime() : 0;
  if (lastPolled && now - lastPolled < DEVICE_POLL_MIN_INTERVAL_MS) {
    const slowAt = new Date().toISOString();
    await admin.from("trackmcp_cli_device_sessions").update({ last_slow_down_at: slowAt, poll_count: Math.min(session.poll_count + 1, DEVICE_MAX_POLLS) }).eq("id", session.id).eq("status", session.status);
    return NextResponse.json({ status: "slow_down", interval: DEVICE_SLOW_POLL_INTERVAL_SECONDS });
  }
  await admin.from("trackmcp_cli_device_sessions").update({ last_polled_at: new Date().toISOString(), poll_count: session.poll_count + 1 }).eq("id", session.id).in("status", ["pending", "approved"]);
  if (session.status === "approved") return NextResponse.json({ status: "approved" });
  return NextResponse.json({ status: "authorization_pending", interval: DEVICE_POLL_INTERVAL_SECONDS });
}
