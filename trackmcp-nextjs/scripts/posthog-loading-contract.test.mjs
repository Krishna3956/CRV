import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const instrumentation = await readFile(new URL("instrumentation-client.ts", root), "utf8");
const loader = await readFile(new URL("src/lib/posthog-client.ts", root), "utf8");
const analytics = await readFile(new URL("src/lib/marketing-analytics.ts", root), "utf8");
const identity = await readFile(new URL("src/components/PostHogIdentity.tsx", root), "utf8");

test("optional PostHog analytics stays out of the initial client path", () => {
  assert.doesNotMatch(instrumentation, /from ["']posthog-js["']/);
  assert.match(instrumentation, /schedulePostHogInit/);
  assert.match(loader, /import\(["']posthog-js["']\)/);
  assert.match(loader, /requestIdleCallback/);
  assert.match(loader, /setTimeout\(initialize, 3000\)/);
  assert.match(loader, /pendingActions/);
  assert.match(loader, /queuePostHog/);
  assert.match(loader, /maskAllInputs: true/);
  assert.match(loader, /recordHeaders: false/);
  assert.match(loader, /recordBody: false/);
  assert.doesNotMatch(analytics, /from ["']posthog-js["']/);
  assert.doesNotMatch(identity, /from ["']posthog-js["']/);
});
