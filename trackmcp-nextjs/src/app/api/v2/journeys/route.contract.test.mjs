import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("versioned journeys route is bounded and honest about identity", async () => {
  const route = await readFile(new URL("./route.ts", import.meta.url), "utf8");
  const handlers = await readFile(new URL("./handlers.ts", import.meta.url), "utf8");
  assert.match(route, /export \{ GET \}/);
  assert.doesNotMatch(route, /POST|PATCH|DELETE/);
  assert.match(handlers, /journey_count/);
  assert.match(handlers, /journey_summary/);
  assert.match(handlers, /explicitly_completed/);
  assert.match(handlers, /Unresolved journeys are not counted as abandoned/);
  assert.match(handlers, /not a unique person/);
  assert.match(handlers, /slice\(0, 100\)/);
  assert.match(handlers, /createAnalyticsHandler/);
});
