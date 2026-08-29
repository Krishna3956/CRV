import { NextRequest, NextResponse } from "next/server";

const APP_HOST = "app.trackmcp.com";
const MARKETING_HOSTS = new Set(["trackmcp.com", "www.trackmcp.com"]);

export function proxy(request: NextRequest) {
  const host = request.headers.get("x-forwarded-host")?.split(",")[0].trim() || request.headers.get("host") || "";
  if (process.env.NODE_ENV !== "production" || !MARKETING_HOSTS.has(host)) return NextResponse.next();

  const target = new URL(request.nextUrl.pathname + request.nextUrl.search, `https://${APP_HOST}`);
  return NextResponse.redirect(target, 308);
}

export const config = {
  matcher: ["/signin/:path*", "/signup/:path*", "/dashboard/:path*", "/onboarding/:path*", "/auth/callback/:path*"],
};
