import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("versioned tool detail route is GET-only and bounded", async () => {
  const route = await readFile(new URL("./[name]/route.ts", import.meta.url), "utf8");
  const handlers = await readFile(new URL("./[name]/handlers.ts", import.meta.url), "utf8");
  assert.match(route, /export \{ GET \}/);
  assert.doesNotMatch(route, /POST|PATCH|DELETE/);
  assert.match(handlers, /Tool not found/);
  assert.match(handlers, /data_trust/);
  assert.match(handlers, /description\.slice\(0, 2000\)/);
  assert.doesNotMatch(handlers, /payload/);
});
