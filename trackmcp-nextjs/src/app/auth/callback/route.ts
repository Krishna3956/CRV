import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/auth/supabase-server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (code) await (await getSupabaseServer()).auth.exchangeCodeForSession(code);
  return NextResponse.redirect(new URL("/onboarding", url.origin));
}
