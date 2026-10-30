const RETRYABLE_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [150, 350];
const CLOSED_PROVIDERS = Object.freeze({ google: false, github: false });

function isProviderSettings(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value)
    && typeof value.google === "boolean" && typeof value.github === "boolean");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Discover enabled providers while tolerating a bounded transient edge error. */
export async function discoverAuthProviders({ fetchImpl, sleepImpl = sleep, maxAttempts = MAX_ATTEMPTS } = {}) {
  const request = fetchImpl || globalThis.fetch?.bind(globalThis);
  if (typeof request !== "function") return CLOSED_PROVIDERS;
  const attempts = Number.isInteger(maxAttempts) ? Math.max(1, Math.min(maxAttempts, MAX_ATTEMPTS)) : MAX_ATTEMPTS;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await request("/api/auth/providers", { headers: { accept: "application/json" }, cache: "no-store" });
      if (response.ok) {
        const value = await response.json();
        return isProviderSettings(value) ? { google: value.google, github: value.github } : CLOSED_PROVIDERS;
      }
      if (!RETRYABLE_STATUSES.has(response.status) || attempt === attempts - 1) return CLOSED_PROVIDERS;
    } catch {
      if (attempt === attempts - 1) return CLOSED_PROVIDERS;
    }
    await sleepImpl(RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length - 1)]);
  }
  return CLOSED_PROVIDERS;
}

export { RETRYABLE_STATUSES };
