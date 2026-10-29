import { NextResponse } from "next/server";

type AuthSettings = { external?: { google?: unknown; github?: unknown } };

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ google: false, github: false }, { headers: { "Cache-Control": "no-store" } });
  }

  try {
    const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/auth/v1/settings`, {
      headers: { apikey: anonKey, authorization: `Bearer ${anonKey}` },
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) {
      return NextResponse.json({ google: false, github: false }, { headers: { "Cache-Control": "no-store" } });
    }
    const settings = (await response.json()) as AuthSettings;
    return NextResponse.json(
      { google: settings.external?.google === true, github: settings.external?.github === true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    // A provider discovery failure must not leave an unusable social button on
    // the page. Email/password remains available as the safe fallback.
    return NextResponse.json({ google: false, github: false }, { headers: { "Cache-Control": "no-store" } });
  }
}
