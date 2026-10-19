import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./route.ts", import.meta.url), "utf8");

test("admin workspace creation uses timing-safe auth and bounded JSON input", () => {
  assert.match(source, /x-trackmcp-admin-key/);
  assert.match(source, /timingSafeEqual/);
  assert.match(source, /arrayBuffer\(\)/);
  assert.match(source, /raw\.byteLength > 4096/);
  assert.match(source, /Request is too large/);
  assert.match(source, /Array\.isArray\(parsed\)/);
  assert.match(source, /api_key: generated\.key/);
  assert.match(source, /api_key: generated\.key[\s\S]*?cache-control.*no-store/);
  assert.doesNotMatch(source, /console\.log\(.*generated\.key/);
});
