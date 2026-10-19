import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("versioned tools route exposes bounded tool projections only", async () => {
  const route = await readFile(new URL("./route.ts", import.meta.url), "utf8");
  const handlers = await readFile(new URL("./handlers.ts", import.meta.url), "utf8");
  assert.match(route, /export \{ GET \}/);
  for (const field of ["tools", "catalog_tools", "unused_tools", "tool_name", "filter", "data_trust", "next_cursor", "decodeCursor", "MAX_PAGE_SIZE"]) assert.match(handlers, new RegExp(field));
  assert.match(handlers, /createAnalyticsHandler/);
  assert.doesNotMatch(route, /POST|PATCH|DELETE/);
});
