const DEFAULT_AUTH_NEXT = "/dashboard";

/**
 * Keep post-auth redirects inside TrackMCP. This value can come from a query
 * string, so it must never be passed to a redirect or OAuth provider raw.
 */
export function safeAuthNext(value: string | null | undefined, fallback = DEFAULT_AUTH_NEXT): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }

  try {
    const parsed = new URL(value, "https://trackmcp.invalid");
    return parsed.origin === "https://trackmcp.invalid" ? value : fallback;
  } catch {
    return fallback;
  }
}

export function authCallbackUrl(origin: string, next: string): string {
  const callback = new URL("/auth/callback", origin);
  callback.searchParams.set("next", safeAuthNext(next));
  return callback.toString();
}
