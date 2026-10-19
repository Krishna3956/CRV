import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("versioned catalogs route exposes a bounded authenticated snapshot projection", async () => {
  const route = await readFile(new URL("./route.ts", import.meta.url), "utf8");
  const handlers = await readFile(new URL("./handlers.ts", import.meta.url), "utf8");
  assert.match(route, /export \{ GET \}/);
  for (const field of ["catalogs", "snapshot_source", "observed_at", "versioning", "historical_versions", "diff_status", "pagination", "next_cursor", "catalog_before", "data_trust"]) assert.match(handlers, new RegExp(field));
  assert.match(handlers, /createAnalyticsHandler/);
  assert.match(handlers, /slice\(0, MAX_TOOLS\)/);
  assert.doesNotMatch(route, /POST|PATCH|DELETE/);
});
