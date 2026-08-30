import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const APP_HOST = "app.trackmcp.com";
const MARKETING_HOSTS = new Set(["trackmcp.com", "www.trackmcp.com"]);

export async function proxy(request: NextRequest) {
  const host = request.headers.get("x-forwarded-host")?.split(",")[0].trim() || request.headers.get("host") || "";

  // The app subdomain shares this deployment with the marketing site, but its
  // root should always enter the product instead of rendering the homepage.
  if (process.env.NODE_ENV === "production" && host === APP_HOST && request.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/signin", request.url), 307);
  }

  if (process.env.NODE_ENV !== "production" || !MARKETING_HOSTS.has(host)) {
    let response = NextResponse.next({ request });
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });
    await supabase.auth.getUser();
    return response;
  }

  const target = new URL(request.nextUrl.pathname + request.nextUrl.search, `https://${APP_HOST}`);
  return NextResponse.redirect(target, 308);
}

export const config = {
  matcher: ["/", "/signin/:path*", "/signup/:path*", "/dashboard/:path*", "/onboarding/:path*", "/auth/callback/:path*"],
};
