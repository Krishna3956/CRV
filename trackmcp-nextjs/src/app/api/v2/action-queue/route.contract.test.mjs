import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("versioned action queue is a bounded GET-only projection", async () => {
  const route = await readFile(new URL("./route.ts", import.meta.url), "utf8");
  const handlers = await readFile(new URL("./handlers.ts", import.meta.url), "utf8");
  assert.match(route, /export \{ GET \}/);
  assert.doesNotMatch(route, /POST|PATCH|DELETE/);
  assert.match(handlers, /createActionQueueHandlers/);
  assert.match(handlers, /MAX_ITEMS/);
  assert.match(handlers, /api_version/);
  assert.match(handlers, /total_events:/);
  assert.match(handlers, /Queue freshness is not a telemetry watermark/);
  assert.doesNotMatch(handlers, /from\("trackmcp_events"\)/);
});
