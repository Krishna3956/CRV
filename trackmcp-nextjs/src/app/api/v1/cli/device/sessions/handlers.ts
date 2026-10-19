import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/repository/supabase";
import {
  createDeviceCode, createUserCode, DEVICE_SESSION_TTL_SECONDS,
  DEVICE_POLL_INTERVAL_SECONDS, deviceVerificationUri, deviceVerificationUriComplete,
  hashDeviceCode, normalizeBounded, normalizePackageManager, readBoundedJsonObject,
} from "@/lib/cli/device-auth";
import { clientRateLimitKey, consumeRateLimitDetailedAsync, rateLimitHeaders } from "@/lib/cli/rate-limit";

type StartDeps = {
  getAdmin?: () => NonNullable<ReturnType<typeof getSupabaseAdmin>> | null;
  consumeRateLimit?: typeof consumeRateLimitDetailedAsync;
};

export function createDeviceSessionHandler(deps: StartDeps = {}) {
  const getAdmin = deps.getAdmin ?? getSupabaseAdmin;
  const consume = deps.consumeRateLimit ?? consumeRateLimitDetailedAsync;
  return async function POST(request: Request) {
    const admin = getAdmin();
    if (!admin) return NextResponse.json({ error: "Device authorization is not configured." }, { status: 503 });
    const decision = await consume({ key: clientRateLimitKey(request, "device-start"), limit: 10, windowMs: 60_000 });
    if (!decision.allowed) return NextResponse.json({ error: "Too many device sessions. Try again shortly." }, { status: 429, headers: rateLimitHeaders(decision) });
    const parsed = await readBoundedJsonObject(request);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    const body = parsed.value;
    const deviceCode = createDeviceCode();
    const userCode = createUserCode();
    const expiresAt = new Date(Date.now() + DEVICE_SESSION_TTL_SECONDS * 1000).toISOString();
    const insert = await admin.from("trackmcp_cli_device_sessions").insert({
      device_code_hash: hashDeviceCode(deviceCode), user_code_hash: hashDeviceCode(userCode), status: "pending",
      client_version: normalizeBounded(body.client_version, 64, "unknown"), platform: normalizeBounded(body.platform, 64, "unknown"),
      package_manager: normalizePackageManager(body.package_manager), sdk_package: normalizeBounded(body.sdk_package, 128, "@trackmcp/sdk"), expires_at: expiresAt,
    });
    if (insert.error) { console.error("CLI device session creation failed", { code: insert.error.code, message: insert.error.message }); return NextResponse.json({ error: "Could not start device authorization." }, { status: 500 }); }
    return NextResponse.json({ device_code: deviceCode, user_code: userCode, verification_uri: deviceVerificationUri(), verification_uri_complete: deviceVerificationUriComplete(userCode), expires_in: DEVICE_SESSION_TTL_SECONDS, interval: DEVICE_POLL_INTERVAL_SECONDS }, { status: 201, headers: { "cache-control": "no-store" } });
  };
}
