import { createHash, randomBytes } from "node:crypto";

export const DEVICE_SESSION_TTL_SECONDS = 600;
export const DEVICE_POLL_INTERVAL_SECONDS = 5;
export const DEVICE_SLOW_POLL_INTERVAL_SECONDS = 10;
export const DEVICE_POLL_MIN_INTERVAL_MS = 3_000;
export const DEVICE_MAX_POLLS = 120;

export type DeviceStatus = "pending" | "approved" | "denied" | "redeeming" | "redeemed" | "expired";

export function hashDeviceCode(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function createDeviceCode(): string {
  return randomBytes(32).toString("base64url");
}

export function createUserCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(8);
  const raw = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
  return `${raw.slice(0, 4)}-${raw.slice(4)}`;
}

export function normalizeBounded(value: unknown, max: number, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim();
  return normalized && normalized.length <= max ? normalized : fallback;
}

export function normalizePackageManager(value: unknown): "npm" | "pnpm" | "yarn" | "bun" | "unknown" {
  return value === "npm" || value === "pnpm" || value === "yarn" || value === "bun" ? value : "unknown";
}

export function appHost(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL || "https://app.trackmcp.com";
  try {
    const parsed = new URL(configured);
    return parsed.origin;
  } catch {
    return "https://app.trackmcp.com";
  }
}

export function deviceVerificationUri(): string {
  return `${appHost()}/device`;
}

export function deviceVerificationUriComplete(userCode: string): string {
  return `${deviceVerificationUri()}?user_code=${encodeURIComponent(userCode)}`;
}

export function isExpired(expiresAt: string | Date, now = Date.now()): boolean {
  return new Date(expiresAt).getTime() <= now;
}
