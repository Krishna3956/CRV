import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/auth/supabase-server";

// Canonical, user-facing origin. Never derive this from the incoming request
// host: behind the Cloudflare Worker + App Runner proxy, request.url resolves to
// the container's internal bind address (http://0.0.0.0:8080), which would leak
// into redirect URLs. Override with NEXT_PUBLIC_SITE_URL for local dev.
const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL || "https://app.trackmcp.com";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const providerError = url.searchParams.get("error_description") || url.searchParams.get("error");
  if (providerError) {
    return NextResponse.redirect(new URL(`/signin?auth_error=${encodeURIComponent(providerError)}`, SITE_ORIGIN));
  }
  if (!code) {
    return NextResponse.redirect(new URL("/signin?auth_error=missing_link_code", SITE_ORIGIN));
  }
  const { error } = await (await getSupabaseServer()).auth.exchangeCodeForSession(code);
  if (error) {
    const message = error.message.toLowerCase();
    const errorCode = message.includes("code verifier") || message.includes("pkce")
      ? "link_unavailable"
      : "sign_in_failed";
    return NextResponse.redirect(new URL(`/signin?auth_error=${errorCode}`, SITE_ORIGIN));
  }
  return NextResponse.redirect(new URL("/dashboard/onboarding", SITE_ORIGIN));
}
