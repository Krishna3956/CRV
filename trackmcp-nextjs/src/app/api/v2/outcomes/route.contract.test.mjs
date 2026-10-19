import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("versioned outcomes route preserves unknown evidence", async () => {
  const route = await readFile(new URL("./route.ts", import.meta.url), "utf8");
  const handlers = await readFile(new URL("./handlers.ts", import.meta.url), "utf8");
  assert.match(route, /export \{ GET \}/);
  assert.doesNotMatch(route, /POST|PATCH|DELETE/);
  assert.match(handlers, /not_observable/);
  assert.match(handlers, /evidence_state/);
  assert.match(handlers, /terminal_denominator/);
  assert.match(handlers, /terminal_completed/);
  assert.match(handlers, /semantic_outcomes/);
  assert.match(handlers, /task_states/);
  assert.match(handlers, /terminal_workflow_outcomes/);
  assert.match(handlers, /explicit terminal workflow facts/);
  assert.match(handlers, /remains unknown/);
  assert.match(handlers, /data_trust/);
  assert.match(handlers, /createAnalyticsHandler/);
});
