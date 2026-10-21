import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const handlers = await readFile(new URL("./handlers.ts", import.meta.url), "utf8");
const route = await readFile(new URL("./route.ts", import.meta.url), "utf8");

test("protocol activity is a bounded authenticated v2 projection", () => {
  assert.match(route, /import \{ GET \} from "\.\/handlers\.ts"/);
  assert.match(handlers, /createAnalyticsHandler/);
  assert.match(handlers, /withTrackMCPV2Envelope/);
  assert.match(handlers, /protocol_family_activity/);
  assert.match(handlers, /slice\(0, 5\)/);
  assert.match(handlers, /not customer demand/);
  assert.doesNotMatch(handlers, /raw[_-]?(payload|key)|api_key|tool_arguments/i);
});
