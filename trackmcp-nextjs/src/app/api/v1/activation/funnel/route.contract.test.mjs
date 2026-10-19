import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./route.ts", import.meta.url), "utf8");

test("activation funnel is admin-key protected and bounds the report window", () => {
  assert.match(source, /x-trackmcp-admin-key/);
  assert.match(source, /timingSafeEqual/);
  assert.match(source, /MAX_REPORT_WINDOW_MS = 31 \* 86400_000/);
  assert.match(source, /toMs <= fromMs/);
  assert.match(source, /toMs - fromMs > MAX_REPORT_WINDOW_MS/);
  assert.match(source, /no longer than 31 days/);
  assert.match(source, /cache-control.*no-store/);
  assert.doesNotMatch(source, /api_key|key_hash|device_code|raw_payload/);
});
