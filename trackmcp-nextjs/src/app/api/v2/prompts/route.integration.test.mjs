import assert from "node:assert/strict";
import test from "node:test";
import { createPromptsHandler } from "./handlers.ts";

test("prompts v2 publishes only the prompt-safe activity projection", async () => {
  const analytics = async () => new Response(JSON.stringify({
    range_days: 7,
    interaction_surfaces: { prompts: { events: 3, methods: ["prompts/get", "prompts/list"], entity_count: 2, private_payload: "do-not-return" } },
    resource_prompt_activity: {
      prompt_calls: 2, prompt_observations: 2, previous_period_prompt_calls: 1,
      prompt_completion_rate: 0, prompt_stall_rate: 0.5, prompt_error_rate: 0.5,
      outcomes: [{ kind: "resource", interactions: 9 }, { kind: "prompt", interactions: 2, complete: 0, stalled: 1, errored: 1, unknown: 0, linked_retry_count: 0 }],
      prompt_breakdown: [{ name: "prompts/get", calls: 2, private_payload: "do-not-return" }],
      trend: [{ kind: "resource", name: "resources/read", calls: 9 }, { kind: "prompt", name: "prompts/get", calls: 2 }],
    },
  }), { status: 200, headers: { "content-type": "application/json" } });
  const response = await createPromptsHandler(analytics)(new Request("https://trackmcp.test/api/v2/prompts"));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.activity.interactions, 2);
  assert.equal(body.activity.input_required_rate, 0.5);
  assert.deepEqual(body.activity.outcomes, [{ kind: "prompt", interactions: 2, complete: 0, stalled: 1, errored: 1, unknown: 0, linked_retry_count: 0 }]);
  assert.deepEqual(body.activity.trend, [{ kind: "prompt", name: "prompts/get", calls: 2 }]);
  assert.equal(JSON.stringify(body).includes("resources/read"), false);
  assert.equal(JSON.stringify(body).includes("private_payload"), false);
});
