import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("versioned people route refuses to claim unique identities", async () => {
  const route = await readFile(new URL("./route.ts", import.meta.url), "utf8");
  const handlers = await readFile(new URL("./handlers.ts", import.meta.url), "utf8");
  assert.match(route, /export \{ GET \}/);
  assert.doesNotMatch(route, /POST|PATCH|DELETE/);
  assert.match(handlers, /unique_people: null/);
  assert.match(handlers, /unique_organizations: null/);
  assert.match(handlers, /not a verified person identity/);
  assert.match(handlers, /identity_coverage/);
  assert.match(handlers, /identity_source_counts/);
  assert.match(handlers, /createAnalyticsHandler/);
});
