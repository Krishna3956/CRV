import assert from "node:assert/strict";
import test from "node:test";
import { createResourcesHandler } from "./handlers.ts";

test("resources v2 publishes only the resource-safe activity projection", async () => {
  const analytics = async () => new Response(JSON.stringify({
    range_days: 7,
    interaction_surfaces: { resources: { events: 4, methods: ["resources/read", "resources/list"], entity_count: 2 } },
    resource_prompt_activity: {
      resource_reads: 2, resource_observations: 3, previous_period_resource_reads: 1,
      resource_completion_rate: 0.5, resource_stall_rate: 0, resource_error_rate: 0.5,
      outcomes: [{ kind: "resource", interactions: 2, complete: 1, stalled: 0, errored: 1, unknown: 0, linked_retry_count: 1 }, { kind: "prompt", interactions: 9 }],
      resource_breakdown: [{ name: "resources/read", calls: 2 }],
      trend: [{ kind: "resource", name: "resources/read", calls: 3 }, { kind: "prompt", name: "prompts/get", calls: 9 }],
    },
  }), { status: 200, headers: { "content-type": "application/json" } });
  const response = await createResourcesHandler(analytics)(new Request("https://trackmcp.test/api/v2/resources"));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.activity.interactions, 2);
  assert.equal(body.activity.observations, 3);
  assert.deepEqual(body.activity.outcomes, [{ kind: "resource", interactions: 2, complete: 1, stalled: 0, errored: 1, unknown: 0, linked_retry_count: 1 }]);
  assert.deepEqual(body.activity.trend, [{ kind: "resource", name: "resources/read", calls: 3 }]);
  assert.equal(JSON.stringify(body).includes("prompts/get"), false);
});
