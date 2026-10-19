import assert from "node:assert/strict";
import test from "node:test";
import { createVersionedActionQueueHandler } from "./handlers.ts";

test("action queue envelope reports bounded rows without a fake telemetry watermark", async () => {
  const handler = createVersionedActionQueueHandler(async () => new Response(JSON.stringify({
    data: [{ id: "a1", status: "open" }, { id: "a2", status: "snoozed" }],
    next_cursor: null,
    limit: 100,
  }), { status: 200, headers: { "content-type": "application/json" } }));
  const response = await handler(new Request("https://example.test/api/v2/action-queue"));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.source_count, 2);
  assert.equal(body.evidence_quality, "observed");
  assert.equal(body.freshness.observed_through, null);
  assert.equal(body.truncated, false);
  assert.equal(body.data.length, 2);
  assert.match(body.caveats.join(" "), /not a telemetry watermark/);
});

test("v2 action queue requests the optional alert relationship without exposing a secret", async () => {
  let observedUrl = "";
  const handler = createVersionedActionQueueHandler(async (request) => {
    observedUrl = request.url;
    return new Response(JSON.stringify({ data: [], next_cursor: null, limit: 100 }), { status: 200, headers: { "content-type": "application/json" } });
  });
  await handler(new Request("https://example.test/api/v2/action-queue"));
  assert.equal(new URL(observedUrl).searchParams.get("include_alerts"), "true");
  assert.doesNotMatch(observedUrl, /key|token|payload/i);
});
