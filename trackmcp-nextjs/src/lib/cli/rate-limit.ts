import { createHash } from "node:crypto";

type Bucket = { count: number; resetAt: number };
export type RateLimitMode = "distributed" | "memory_degraded";
export type RateLimitRequest = { key: string; limit: number; windowMs: number; now?: number };
export type RateLimitDecision = { allowed: boolean; mode: RateLimitMode; retryAfterSeconds: number };

export interface RateLimitProvider {
  readonly mode: RateLimitMode;
  consume(request: RateLimitRequest): RateLimitDecision;
}
export type AsyncRateLimitProvider = { readonly mode: RateLimitMode; consume(request: RateLimitRequest): Promise<RateLimitDecision> };

const MAX_BUCKETS = 10_000;

/** Bounded process memory fallback. It does not coordinate across instances. */
export class InMemoryRateLimitProvider implements RateLimitProvider {
  readonly mode = "memory_degraded" as const;
  private readonly buckets = new Map<string, Bucket>();

  consume({ key, limit, windowMs, now = Date.now() }: RateLimitRequest): RateLimitDecision {
    if (this.buckets.size >= MAX_BUCKETS && !this.buckets.has(key)) {
      for (const [candidate, bucket] of this.buckets) if (bucket.resetAt <= now) this.buckets.delete(candidate);
      // Fail open on memory pressure; the edge/WAF remains the hard boundary.
      if (this.buckets.size >= MAX_BUCKETS) return { allowed: true, mode: this.mode, retryAfterSeconds: 0 };
    }
    const current = this.buckets.get(key);
    if (!current || current.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, mode: this.mode, retryAfterSeconds: 0 };
    }
    if (current.count >= limit) return { allowed: false, mode: this.mode, retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
    current.count += 1;
    return { allowed: true, mode: this.mode, retryAfterSeconds: 0 };
  }
}

let provider: RateLimitProvider = new InMemoryRateLimitProvider();
export function setRateLimitProvider(next: RateLimitProvider): void { provider = next; }
export function getRateLimitProvider(): RateLimitProvider { return provider; }
export function consumeRateLimitDetailed(request: RateLimitRequest): RateLimitDecision { return provider.consume(request); }
/** Async entry point used by routes that may opt into a distributed provider. */
export async function consumeRateLimitDetailedAsync(request: RateLimitRequest): Promise<RateLimitDecision> {
  const configuredMode = process.env.TRACKMCP_RATE_LIMIT_MODE?.trim();
  if (!configuredMode) return provider.consume(request);
  // `memory` is an explicit, single-process development/limited-environment
  // choice. It must not be treated as an invalid mode or silently fail closed.
  if (configuredMode === "memory") return provider.consume(request);
  if (configuredMode !== "supabase") return { allowed: false, mode: "distributed", retryAfterSeconds: 30 };
  const { getSupabaseAdmin } = await import("../repository/supabase.ts");
  const { SupabaseRateLimitProvider } = await import("./supabase-rate-limit.ts");
  const admin = getSupabaseAdmin();
  if (!admin) return { allowed: false, mode: "distributed", retryAfterSeconds: 30 };
  return new SupabaseRateLimitProvider(admin as never).consume(request);
}
/** Backward-compatible boolean API. */
export function consumeRateLimit(key: string, limit: number, windowMs: number, now?: number): boolean { return consumeRateLimitDetailed({ key, limit, windowMs, now }).allowed; }

/** Only trust forwarding headers when a trusted edge is configured to rewrite them. */
export function clientRateLimitKey(request: Request, scope: string): string {
  const trustedProxy = process.env.TRACKMCP_TRUST_PROXY === "true";
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const edgeAddress = request.headers.get("cf-connecting-ip")?.trim();
  const address = trustedProxy ? (edgeAddress || forwarded || "unknown") : "unknown";
  return `${scope}:${createHash("sha256").update(address).digest("hex")}`;
}

export function rateLimitHeaders(decision: RateLimitDecision): Record<string, string> {
  return { "x-trackmcp-rate-limit-mode": decision.mode, ...(decision.retryAfterSeconds > 0 ? { "retry-after": String(decision.retryAfterSeconds) } : {}) };
}
