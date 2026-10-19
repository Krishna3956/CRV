import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("versioned overview route is a GET-only bounded analytics surface", async () => {
  const route = await readFile(new URL("./route.ts", import.meta.url), "utf8");
  const handlers = await readFile(new URL("./handlers.ts", import.meta.url), "utf8");
  assert.match(route, /export \{ GET \}/);
  assert.match(handlers, /createAnalyticsHandler/);
  assert.doesNotMatch(route, /POST|PATCH|DELETE/);
});
