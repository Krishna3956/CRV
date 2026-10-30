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
  assert.match(handlers, /protocol_family_outcomes/);
  assert.match(handlers, /protocol_family_outcome_source/);
  assert.match(handlers, /protocol_transport_outcomes/);
  assert.match(handlers, /protocol_mrtr_linkage/);
  assert.match(handlers, /protocol_capability_gaps/);
  assert.match(handlers, /matched_advertised/);
  assert.match(handlers, /boundedTransport/);
  assert.match(handlers, /Completed is an explicit protocol result/);
  assert.match(handlers, /slice\(0, 10\)/);
  assert.match(handlers, /not customer demand/);
  assert.doesNotMatch(handlers, /raw[_-]?(payload|key)|api_key|tool_arguments/i);
});
