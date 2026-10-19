import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("versioned reliability route is conservative and GET-only", async () => {
  const route = await readFile(new URL("./route.ts", import.meta.url), "utf8");
  const handlers = await readFile(new URL("./handlers.ts", import.meta.url), "utf8");
  assert.match(route, /export \{ GET \}/);
  assert.doesNotMatch(route, /POST|PATCH|DELETE/);
  for (const field of ["completion_rate", "correlation_quality", "data_trust", "comparison_ready", "insufficient_data", "baseline_comparison", "minimum_calls", "caveats"]) assert.match(handlers, new RegExp(field));
  assert.match(handlers, /not infrastructure uptime/);
  assert.match(handlers, /slice\(-90\)/);
  assert.match(handlers, /observedToolCallDays/);
  assert.match(handlers, /calls > 0/);
  assert.match(handlers, /MIN_COMPARISON_CALLS = 30/);
  assert.match(handlers, /not infrastructure uptime or a causal deployment analysis/);
  assert.match(handlers, /createAnalyticsHandler/);
});
