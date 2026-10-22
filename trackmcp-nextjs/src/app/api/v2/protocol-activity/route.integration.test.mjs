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
    data_trust: { generated_at: "2026-01-02T00:00:00.000Z", source_event_count: 4, private_payload: "do-not-return" },
  }), { status: 200 }));
  const response = await handler(new Request("https://example.test/api/v2/protocol-activity"));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body.protocol_family_activity, [
    { family: "tasks", observations: 3 },
    { family: "sampling", observations: 2 },
  ]);
  assert.equal(body.data_trust.source_event_count, 4);
  assert.equal("private_payload" in body.data_trust, false);
});
