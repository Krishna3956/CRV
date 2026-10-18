import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/repository/supabase";
import {
  createDeviceCode,
  createUserCode,
  DEVICE_SESSION_TTL_SECONDS,
  DEVICE_POLL_INTERVAL_SECONDS,
  deviceVerificationUri,
  deviceVerificationUriComplete,
  hashDeviceCode,
  normalizeBounded,
  normalizePackageManager,
} from "@/lib/cli/device-auth";
import { consumeRateLimit } from "@/lib/cli/rate-limit";

export async function POST(request: Request) {
  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: "Device authorization is not configured." }, { status: 503 });
  const address = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!consumeRateLimit(`device-start:${address}`, 10, 60_000)) return NextResponse.json({ error: "Too many device sessions. Try again shortly." }, { status: 429, headers: { "retry-after": "60" } });

  let body: Record<string, unknown> = {};
  try {
    const parsed = await request.json();
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const deviceCode = createDeviceCode();
  const userCode = createUserCode();
  const expiresAt = new Date(Date.now() + DEVICE_SESSION_TTL_SECONDS * 1000).toISOString();
  const insert = await admin.from("trackmcp_cli_device_sessions").insert({
    device_code_hash: hashDeviceCode(deviceCode),
    user_code_hash: hashDeviceCode(userCode),
    status: "pending",
    client_version: normalizeBounded(body.client_version, 64, "unknown"),
    platform: normalizeBounded(body.platform, 64, "unknown"),
    package_manager: normalizePackageManager(body.package_manager),
    sdk_package: normalizeBounded(body.sdk_package, 128, "@trackmcp/sdk"),
    expires_at: expiresAt,
  });
  if (insert.error) {
    console.error("CLI device session creation failed", { code: insert.error.code, message: insert.error.message });
    return NextResponse.json({ error: "Could not start device authorization." }, { status: 500 });
  }

  return NextResponse.json({
    device_code: deviceCode,
    user_code: userCode,
    verification_uri: deviceVerificationUri(),
    verification_uri_complete: deviceVerificationUriComplete(userCode),
    expires_in: DEVICE_SESSION_TTL_SECONDS,
    interval: DEVICE_POLL_INTERVAL_SECONDS,
  }, { status: 201, headers: { "cache-control": "no-store" } });
}
