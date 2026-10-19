import assert from "node:assert/strict";
import test from "node:test";
import { createJourneysHandler } from "./handlers.ts";

test("journeys counts only explicit workflow terminals and leaves unresolved sessions visible", async () => {
  const handler = createJourneysHandler(async () => new Response(JSON.stringify({
    range_days: 30,
    workflows: [
      { session_id: "a", completed: true, completion_source: "workflow_events" },
      { session_id: "b", completed: false, completion_source: "workflow_events" },
      { session_id: "c", completed: false, completion_source: "session_heuristic" },
    ],
    correlation_quality: "mixed",
    data_trust: { source_count: 3 },
  }), { status: 200, headers: { "content-type": "application/json" } }));
  const response = await handler(new Request("https://example.test/api/v2/journeys"));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body.journey_summary, {
    observed: 3,
    explicitly_completed: 1,
    explicitly_failed: 1,
    unresolved: 1,
    completion_rate: 0.5,
    evidence_state: "observed",
  });
  assert.match(body.caveats.join(" "), /not counted as abandoned/);
});
