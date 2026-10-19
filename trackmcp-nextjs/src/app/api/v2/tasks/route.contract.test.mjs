import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const handlers = await readFile(new URL("./handlers.ts", import.meta.url), "utf8");
const route = await readFile(new URL("./route.ts", import.meta.url), "utf8");

test("tasks projection is authenticated through analytics, bounded, and evidence-limited", () => {
  assert.match(route, /import \{ GET \} from "\.\/handlers\.ts"/);
  assert.match(handlers, /createAnalyticsHandler/);
  assert.match(handlers, /slice\(0, 100\)/);
  assert.match(handlers, /task_count/);
  assert.match(handlers, /not treated as abandonment/);
  assert.doesNotMatch(handlers, /raw-task|payload|api_key|key_value/i);
});
