import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/auth/supabase-server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const providerError = url.searchParams.get("error_description") || url.searchParams.get("error");
  if (providerError) {
    return NextResponse.redirect(new URL(`/signin?auth_error=${encodeURIComponent(providerError)}`, url.origin));
  }
  if (!code) {
    return NextResponse.redirect(new URL("/signin?auth_error=missing_link_code", url.origin));
  }
  const { error } = await (await getSupabaseServer()).auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL(`/signin?auth_error=${encodeURIComponent(error.message)}`, url.origin));
  }
  return NextResponse.redirect(new URL("/onboarding", url.origin));
}
