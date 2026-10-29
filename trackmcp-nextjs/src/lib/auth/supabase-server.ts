import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers.js";
import type { NextResponse } from "next/server";

/**
 * Create a server client for a route handler. When a route is returning a
 * redirect, pass that response so Supabase's refreshed session cookies are
 * copied onto the actual response object. The cookie store alone is enough
 * for ordinary API reads, but a redirect response can otherwise lose the
 * Set-Cookie headers before the browser reaches the destination.
 */
export async function getSupabaseServer(response?: NextResponse) {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Cookie writes are not available in every Server Component context.
          }
          if (response) {
            cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          }
        },
      },
    },
  );
}
