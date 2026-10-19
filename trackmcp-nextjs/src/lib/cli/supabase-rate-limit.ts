import { createHash } from "node:crypto";
import type { RateLimitDecision, RateLimitRequest, RateLimitMode } from "./rate-limit.ts";

type RpcClient = { rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }> };

function boundedRetry(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.min(86_400, Math.max(0, Math.floor(value))) : 30;
}

/** Atomic service-role adapter for the review-only rate-limit SQL contract. */
export class SupabaseRateLimitProvider {
  readonly mode: RateLimitMode = "distributed";
  private readonly client: RpcClient;
  constructor(client: RpcClient) { this.client = client; }

  async consume({ key, limit, windowMs }: RateLimitRequest): Promise<RateLimitDecision> {
    try {
      const result = await this.client.rpc("trackmcp_consume_rate_limit", {
        // Hash again at the provider boundary so raw credentials can never
        // reach the durable bucket table, even if a future caller forgets to.
        p_bucket_key: createHash("sha256").update(key.slice(0, 512)).digest("hex"),
        p_limit: Math.min(1_000_000, Math.max(1, Math.floor(limit))),
        p_window_seconds: Math.min(86_400, Math.max(1, Math.ceil(windowMs / 1000))),
      });
      const row = Array.isArray(result.data) ? result.data[0] : result.data;
      if (result.error || !row || typeof row !== "object") return { allowed: false, mode: this.mode, retryAfterSeconds: 30 };
      const value = row as { allowed?: unknown; retry_after_seconds?: unknown };
      return { allowed: value.allowed === true, mode: this.mode, retryAfterSeconds: boundedRetry(value.retry_after_seconds) };
    } catch {
      return { allowed: false, mode: this.mode, retryAfterSeconds: 30 };
    }
  }
}
