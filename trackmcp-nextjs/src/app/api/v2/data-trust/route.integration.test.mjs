import assert from "node:assert/strict";
import test from "node:test";
import { createDataTrustHandler } from "./handlers.ts";

test("data-trust route allowlists provenance fields", async () => {
  const handler = createDataTrustHandler(async () => new Response(JSON.stringify({
    range_days: 30,
    data_trust: {
      generated_at: "2026-10-22T00:00:00Z",
      query_since: "2026-10-01T00:00:00Z",
      query_until: "2026-10-22T00:00:00Z",
      source_event_count: 12,
      returned_event_count: 10,
      truncated: false,
      observed_through: "2026-10-22T00:00:00Z",
      private_payload: "do-not-return",
    },
  }), { status: 200, headers: { "content-type": "application/json" } }));
  const response = await handler(new Request("https://example.test/api/v2/data-trust"));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.data_trust.source_event_count, 12);
  assert.equal(body.data_trust.private_payload, undefined);
  assert.equal(JSON.stringify(body).includes("do-not-return"), false);
});
