import assert from "node:assert/strict";
import test from "node:test";
import { createProtocolActivityHandler } from "./handlers.ts";

test("protocol activity keeps family counts and provenance bounded", async () => {
  const handler = createProtocolActivityHandler(async () => new Response(JSON.stringify({
    range_days: 30,
    protocol_family_activity: [
      { family: "sampling", observations: 2 },
      { family: "private", observations: 999 },
      { family: "tasks", observations: 3, private_payload: "do-not-return" },
    ],
    protocol_family_outcomes: [
      { family: "sampling", observations: 2, completed: 1, errors: 0, input_required: 1, unknown: 0 },
      { family: "private", observations: 999, completed: 999, errors: 0, input_required: 0, unknown: 0 },
      { family: "tasks", observations: 3, completed: 1, errors: 1, input_required: 0, unknown: 1, private_payload: "do-not-return" },
    ],
    protocol_family_outcome_source: "durable_facts",
    data_trust: { generated_at: "2026-01-02T00:00:00.000Z", source_event_count: 4, private_payload: "do-not-return" },
  }), { status: 200 }));
  const response = await handler(new Request("https://example.test/api/v2/protocol-activity"));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body.protocol_family_activity, [
    { family: "tasks", observations: 3 },
    { family: "sampling", observations: 2 },
  ]);
  assert.deepEqual(body.protocol_family_outcomes, [
    { family: "tasks", observations: 3, requests: 0, responses: 0, matched: 0, completed: 1, errors: 1, input_required: 0, unknown: 1, capability_advertised: null },
    { family: "sampling", observations: 2, requests: 0, responses: 0, matched: 0, completed: 1, errors: 0, input_required: 1, unknown: 0, capability_advertised: null },
  ]);
  assert.equal(body.protocol_family_outcome_source, "durable_facts");
  assert.ok(body.caveats.some((caveat) => caveat.includes("Completed is an explicit protocol result")));
  assert.equal(body.data_trust.source_event_count, 4);
  assert.equal("private_payload" in body.data_trust, false);
});
