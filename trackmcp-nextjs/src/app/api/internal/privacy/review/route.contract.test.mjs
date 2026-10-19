import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./handlers.ts", import.meta.url), "utf8");

test("privacy review is secret-authenticated, bounded, and non-destructive", () => {
  assert.match(source, /TRACKMCP_PRIVACY_REVIEW_SECRET/);
  assert.match(source, /timingSafeEqual/);
  assert.match(source, /MAX_BODY_BYTES = 4096/);
  assert.match(source, /MAX_LIMIT = 100/);
  assert.match(source, /Completion requires a separately reviewed deletion worker/);
  assert.doesNotMatch(source, /delete\s+from|truncate\s+/i);
  assert.doesNotMatch(source, /idempotency_key/);
});

test("privacy review route is an internal GET/POST surface", () => {
  assert.match(source, /async function GET/);
  assert.match(source, /async function POST/);
  assert.match(source, /reviewPrivacyRequest/);
});
