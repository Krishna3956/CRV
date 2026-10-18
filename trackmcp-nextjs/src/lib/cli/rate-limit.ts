type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

export function consumeRateLimit(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
  if (buckets.size >= MAX_BUCKETS && !buckets.has(key)) {
    for (const [candidate, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(candidate);
    if (buckets.size >= MAX_BUCKETS) return false;
  }
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}
