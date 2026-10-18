import { createHash, createHmac, randomBytes } from "node:crypto";

export function hashTrackMCPKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export function createTrackMCPKey(): { key: string; prefix: string; hash: string } {
  const key = `tmcp_${randomBytes(24).toString("base64url")}`;
  return { key, prefix: key.slice(0, 12), hash: hashTrackMCPKey(key) };
}

/**
 * Derives the one initial CLI key deterministically from a session and a
 * caller-held redemption id. The raw key is never persisted, so a lost HTTP
 * response can be repaired without creating a second key.
 */
export function createDeterministicTrackMCPKey(sessionId: string, redemptionId: string): { key: string; prefix: string; hash: string } | null {
  const secret = process.env.TRACKMCP_DEVICE_KEY_DERIVATION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) return null;
  const material = createHmac("sha256", secret).update(`cli-device:${sessionId}:${redemptionId}`).digest().subarray(0, 24).toString("base64url");
  const key = `tmcp_${material}`;
  return { key, prefix: key.slice(0, 12), hash: hashTrackMCPKey(key) };
}
