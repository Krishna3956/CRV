import assert from "node:assert/strict";
import test from "node:test";
import { createOutcomesHandler } from "./handlers.ts";

test("outcomes prefers explicit shared workflow facts over generic activity", async () => {
  const handler = createOutcomesHandler(async () => new Response(JSON.stringify({
    range_days: 30,
    outcomes: [{ name: "generic", completed: 99, failed: 1 }],
    completion_rate: 1,
    completion_source: "session_heuristic",
    outcome_activity: { completed: 2, failed: 2, pending: 1, unknown: 3, not_observable: 4, completion_rate: 0.5, error_rate: 0.5, task_states: { working: 1, input_required: 0, completed: 1, failed: 0, cancelled: 0, expired: 0, unknown: 0 } },
    founder_os: {
      facts: {
        workflow_completion_rate: 0.5,
        terminal_workflow_completed: 2,
        terminal_workflow_outcomes: 4,
        unresolved_facts: 3,
        evidence_quality: { observed: 4, inferred: 0, insufficient_data: 3, conflicting: 0 },
      },
      groups: {},
    },
    data_trust: { source_count: 4 },
  }), { status: 200, headers: { "content-type": "application/json" } }));
  const response = await handler(new Request("https://example.test/api/v2/outcomes"));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.completion.rate, 0.5);
  assert.equal(body.completion.terminal_denominator, 4);
  assert.equal(body.completion.terminal_completed, 2);
  assert.equal(body.completion.unresolved_facts, 3);
  assert.deepEqual(body.semantic_outcomes.task_states, { working: 1, input_required: 0, completed: 1, failed: 0, cancelled: 0, expired: 0, unknown: 0 });
  assert.match(body.caveats.join(" "), /explicit terminal workflow facts/);
});
