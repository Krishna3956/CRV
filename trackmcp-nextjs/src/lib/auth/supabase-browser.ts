import { createBrowserClient } from "@supabase/ssr";

let browserClient: ReturnType<typeof createBrowserClient> | undefined;

export function getSupabaseBrowser() {
  if (!browserClient) {
    // The marketing host can serve the cached sign-up shell while OAuth
    // completes on app.trackmcp.com. Share the SSR session and PKCE verifier
    // across the two first-party subdomains so the redirect cannot lose the
    // newly-created session.
    const cookieOptions = window.location.hostname.endsWith(".trackmcp.com") || window.location.hostname === "trackmcp.com"
      ? { domain: ".trackmcp.com" }
      : undefined;
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      cookieOptions ? { cookieOptions } : undefined,
    );
  }
  return browserClient;
}
