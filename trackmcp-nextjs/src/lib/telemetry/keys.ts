import { createHash, createHmac, randomBytes } from "node:crypto";

export function hashTrackMCPKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export function createTrackMCPKey(): { key: string; prefix: string; hash: string } {
  const key = `tmcp_${randomBytes(24).toString("base64url")}`;
  return { key, prefix: key.slice(0, 12), hash: hashTrackMCPKey(key) };
}

/**
 * Resolve the secret used for deterministic CLI key recovery. Production must
 * use a dedicated secret; the service-role fallback is available only when a
 * developer explicitly opts into it in a non-production environment.
 */
export function getDeviceKeyDerivationSecret(env: Record<string, string | undefined> = process.env): string | null {
  const dedicated = env.TRACKMCP_DEVICE_KEY_DERIVATION_SECRET?.trim();
  if (dedicated) return dedicated;
  const allowDevelopmentFallback = env.TRACKMCP_ALLOW_SERVICE_ROLE_KEY_FALLBACK === "true"
    && (env.NODE_ENV === "development" || env.NODE_ENV === "test");
  if (allowDevelopmentFallback) return env.SUPABASE_SERVICE_ROLE_KEY?.trim() || null;
  return null;
}

/**
 * Derives the one initial CLI key deterministically from a session and a
 * caller-held redemption id. The raw key is never persisted, so a lost HTTP
 * response can be repaired without creating a second key.
 */
export function createDeterministicTrackMCPKey(sessionId: string, redemptionId: string): { key: string; prefix: string; hash: string } | null {
  const secret = getDeviceKeyDerivationSecret();
  if (!secret) return null;
  const material = createHmac("sha256", secret).update(`cli-device:${sessionId}:${redemptionId}`).digest().subarray(0, 24).toString("base64url");
  const key = `tmcp_${material}`;
  return { key, prefix: key.slice(0, 12), hash: hashTrackMCPKey(key) };
}
