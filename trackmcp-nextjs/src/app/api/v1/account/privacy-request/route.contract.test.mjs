import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const route = await readFile(resolve(process.cwd(), "src/app/api/v1/account/privacy-request/route.ts"), "utf8");
const handlers = await readFile(resolve(process.cwd(), "src/app/api/v1/account/privacy-request/handlers.ts"), "utf8");

test("privacy request route is non-destructive and caller-scoped", () => {
  assert.match(route, /export async function POST/);
  assert.match(route, /export async function GET/);
  assert.match(handlers, /requester_user_id/);
  assert.match(handlers, /idempotency_key/);
  assert.match(handlers, /trackmcp_privacy_requests/);
  assert.doesNotMatch(handlers, /\.delete\(\)|delete\s+from|truncate/i);
  assert.doesNotMatch(handlers, /api_key|key_hash|payload/);
});
