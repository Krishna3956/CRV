import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/auth/supabase-server";
import { safeAuthNext } from "@/lib/auth/redirect";

// Canonical, user-facing origin. Never derive this from the incoming request
// host: behind the Cloudflare Worker + App Runner proxy, request.url resolves to
// the container's internal bind address (http://0.0.0.0:8080), which would leak
// into redirect URLs. Override with NEXT_PUBLIC_SITE_URL for local dev.
const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL || "https://app.trackmcp.com";
const AUTH_ERROR_CODES = new Set(["access_denied", "provider_error", "link_unavailable", "sign_in_failed"]);

function redirectToSignIn(errorCode: string, next: string) {
  const safeCode = AUTH_ERROR_CODES.has(errorCode) ? errorCode : "provider_error";
  const target = new URL("/signin", SITE_ORIGIN);
  target.searchParams.set("auth_error", safeCode);
  target.searchParams.set("next", safeAuthNext(next));
  return NextResponse.redirect(target);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeAuthNext(url.searchParams.get("next"));
  const providerError = url.searchParams.get("error");
  if (providerError) {
    return redirectToSignIn(providerError === "access_denied" ? "access_denied" : "provider_error", next);
  }
  if (!code) {
    return redirectToSignIn("provider_error", next);
  }
  const destination = new URL(safeAuthNext(next), SITE_ORIGIN);
  const successResponse = NextResponse.redirect(destination, {
    headers: { "cache-control": "no-store" },
  });
  const { error } = await (await getSupabaseServer(successResponse)).auth.exchangeCodeForSession(code);
  if (error) {
    const message = error.message.toLowerCase();
    const errorCode = message.includes("code verifier") || message.includes("pkce")
      ? "link_unavailable"
      : "sign_in_failed";
    return redirectToSignIn(errorCode, next);
  }
  return successResponse;
}
