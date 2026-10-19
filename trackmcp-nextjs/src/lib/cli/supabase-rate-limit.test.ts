import assert from "node:assert/strict";
import test from "node:test";
import { SupabaseRateLimitProvider } from "./supabase-rate-limit.ts";
import { consumeRateLimitDetailedAsync, InMemoryRateLimitProvider, setRateLimitProvider } from "./rate-limit.ts";

test("distributed provider forwards bounded bucket arguments", async () => {
  let call: { name: string; args: Record<string, unknown> } | null = null;
  const provider = new SupabaseRateLimitProvider({
    async rpc(name, args) { call = { name, args }; return { data: [{ allowed: false, retry_after_seconds: 12.8 }], error: null }; },
  });
  const decision = await provider.consume({ key: "k".repeat(300), limit: 120.9, windowMs: 61_001 });
  assert.deepEqual(decision, { allowed: false, mode: "distributed", retryAfterSeconds: 12 });
  assert.ok(call);
  const captured = call as { name: string; args: Record<string, unknown> };
  assert.equal(captured.name, "trackmcp_consume_rate_limit");
  assert.equal(String(captured.args.p_bucket_key).length, 64);
  assert.notEqual(captured.args.p_bucket_key, "k".repeat(300));
  assert.equal(captured.args.p_limit, 120);
  assert.equal(captured.args.p_window_seconds, 62);
});

test("distributed provider fails closed when its RPC is unavailable", async () => {
  const provider = new SupabaseRateLimitProvider({ async rpc() { return { data: null, error: new Error("unavailable") }; } });
  assert.deepEqual(await provider.consume({ key: "bucket", limit: 1, windowMs: 1000 }), { allowed: false, mode: "distributed", retryAfterSeconds: 30 });
});

test("independent application instances share the same distributed bucket", async () => {
  const buckets = new Map<string, { count: number; resetAt: number }>();
  const rpc = async (_name: string, args: Record<string, unknown>) => {
    const key = String(args.p_bucket_key);
    const limit = Number(args.p_limit);
    const windowSeconds = Number(args.p_window_seconds);
    const now = Date.now();
    const current = buckets.get(key);
    if (!current || current.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
      return { data: [{ allowed: true, retry_after_seconds: 0 }], error: null };
    }
    if (current.count >= limit) return { data: [{ allowed: false, retry_after_seconds: 7 }], error: null };
    current.count += 1;
    return { data: [{ allowed: true, retry_after_seconds: 0 }], error: null };
  };
  const instanceA = new SupabaseRateLimitProvider({ rpc });
  const instanceB = new SupabaseRateLimitProvider({ rpc });
  assert.deepEqual(await instanceA.consume({ key: "shared-client", limit: 1, windowMs: 10_000 }), { allowed: true, mode: "distributed", retryAfterSeconds: 0 });
  assert.deepEqual(await instanceB.consume({ key: "shared-client", limit: 1, windowMs: 10_000 }), { allowed: false, mode: "distributed", retryAfterSeconds: 7 });
});

test("a provider restart does not erase the shared bucket state", async () => {
  const buckets = new Map<string, { count: number; resetAt: number }>();
  const rpc = async (_name: string, args: Record<string, unknown>) => {
    const key = String(args.p_bucket_key);
    const existing = buckets.get(key);
    if (!existing) {
      buckets.set(key, { count: 1, resetAt: Date.now() + 10_000 });
      return { data: [{ allowed: true, retry_after_seconds: 0 }], error: null };
    }
    return { data: [{ allowed: false, retry_after_seconds: 10 }], error: null };
  };
  await new SupabaseRateLimitProvider({ rpc }).consume({ key: "restart-safe", limit: 1, windowMs: 10_000 });
  assert.deepEqual(await new SupabaseRateLimitProvider({ rpc }).consume({ key: "restart-safe", limit: 1, windowMs: 10_000 }), { allowed: false, mode: "distributed", retryAfterSeconds: 10 });
});

test("an invalid explicit provider mode fails closed instead of degrading silently", async () => {
  const previous = process.env.TRACKMCP_RATE_LIMIT_MODE;
  process.env.TRACKMCP_RATE_LIMIT_MODE = "supabse";
  try {
    assert.deepEqual(await consumeRateLimitDetailedAsync({ key: "bucket", limit: 1, windowMs: 1000 }), { allowed: false, mode: "distributed", retryAfterSeconds: 30 });
  } finally {
    if (previous === undefined) delete process.env.TRACKMCP_RATE_LIMIT_MODE;
    else process.env.TRACKMCP_RATE_LIMIT_MODE = previous;
  }
});

test("an explicit memory mode uses the bounded in-process provider", async () => {
  const previousMode = process.env.TRACKMCP_RATE_LIMIT_MODE;
  const previousProvider = new InMemoryRateLimitProvider();
  setRateLimitProvider(previousProvider);
  process.env.TRACKMCP_RATE_LIMIT_MODE = "memory";
  try {
    const first = await consumeRateLimitDetailedAsync({ key: "memory-mode", limit: 1, windowMs: 10_000, now: 1_000 });
    const second = await consumeRateLimitDetailedAsync({ key: "memory-mode", limit: 1, windowMs: 10_000, now: 1_001 });
    assert.equal(first.allowed, true);
    assert.equal(second.allowed, false);
    assert.equal(second.mode, "memory_degraded");
  } finally {
    if (previousMode === undefined) delete process.env.TRACKMCP_RATE_LIMIT_MODE;
    else process.env.TRACKMCP_RATE_LIMIT_MODE = previousMode;
  }
});
