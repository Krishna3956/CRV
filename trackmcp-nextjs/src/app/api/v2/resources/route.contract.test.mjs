import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("resources route reports observed protocol methods without inventing entities", async () => {
  const route = await readFile(new URL("./route.ts", import.meta.url), "utf8");
  const handlers = await readFile(new URL("./handlers.ts", import.meta.url), "utf8");
  const projections = await readFile(new URL("../read-model-projections.ts", import.meta.url), "utf8");
  assert.match(route, /export \{ GET \}/);
  assert.doesNotMatch(route, /POST|PATCH|DELETE/);
  assert.match(handlers, /interaction_surfaces/);
  assert.match(handlers, /resources: \[\]/);
  assert.match(handlers, /resource_prompt_activity/);
  assert.match(handlers, /Explicitly linked retries are collapsed/);
  assert.match(handlers, /entity_analytics: "bounded_read_projection"/);
  assert.match(handlers, /entity_read_projection/);
  assert.match(projections, /successful_reads/);
  assert.match(handlers, /Raw URIs are never returned/);
});
