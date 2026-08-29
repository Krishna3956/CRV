import { createHash, randomBytes } from "node:crypto";

export function hashTrackMCPKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export function createTrackMCPKey(): { key: string; prefix: string; hash: string } {
  const key = `tmcp_${randomBytes(24).toString("base64url")}`;
  return { key, prefix: key.slice(0, 12), hash: hashTrackMCPKey(key) };
}
