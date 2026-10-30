import assert from "node:assert/strict";
import test from "node:test";
import { createResourcesHandler } from "./handlers.ts";

test("resources v2 publishes only the resource-safe activity projection", async () => {
  const analytics = async () => new Response(JSON.stringify({
    range_days: 7,
    interaction_surfaces: { resources: { events: 4, methods: ["resources/read", "resources/list"], entity_count: 2, entity_analytics: { status: "available", read_events: 3, successful_reads: 2, failed_reads: 1, input_required_reads: 0, transport_breakdown: [{ transport: "streamable_http", read_events: 3, successful_reads: 2, failed_reads: 1 }], private_payload: "do-not-return" }, private_payload: "do-not-return" } },
    resource_prompt_activity: {
      resource_reads: 2, resource_observations: 3, previous_period_resource_reads: 1,
      resource_completion_rate: 0.5, resource_stall_rate: 0, resource_error_rate: 0.5,
      outcomes: [{ kind: "resource", interactions: 2, complete: 1, stalled: 0, errored: 1, unknown: 0, linked_retry_count: 1 }, { kind: "prompt", interactions: 9 }],
      resource_breakdown: [{ name: "resources/read", calls: 2, private_payload: "do-not-return" }],
      trend: [{ kind: "resource", name: "resources/read", calls: 3 }, { kind: "prompt", name: "prompts/get", calls: 9 }],
    },
  }), { status: 200, headers: { "content-type": "application/json" } });
  const response = await createResourcesHandler(analytics)(new Request("https://trackmcp.test/api/v2/resources"));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.activity.interactions, 2);
  assert.equal(body.coverage.level, "entity_read_projection");
  assert.deepEqual(body.observed.entity_analytics, { status: "available", read_events: 3, successful_reads: 2, failed_reads: 1, input_required_reads: 0, transport_breakdown: [{ transport: "streamable_http", read_events: 3, successful_reads: 2, failed_reads: 1 }] });
  assert.equal(body.activity.observations, 3);
  assert.deepEqual(body.activity.outcomes, [{ kind: "resource", interactions: 2, complete: 1, stalled: 0, errored: 1, unknown: 0, linked_retry_count: 1 }]);
  assert.deepEqual(body.activity.trend, [{ kind: "resource", name: "resources/read", calls: 3 }]);
  assert.equal(JSON.stringify(body).includes("prompts/get"), false);
  assert.equal(JSON.stringify(body).includes("private_payload"), false);
});

test("resources v2 advertises entity-read coverage only when the projection is available", async () => {
  const analytics = async () => new Response(JSON.stringify({ range_days: 7, interaction_surfaces: { resources: { events: 4, methods: ["resources/read"], entity_count: 2, entity_analytics: { status: "available", read_events: 3, successful_reads: 2, failed_reads: 1, input_required_reads: 0, transport_breakdown: [{ transport: "unsafe", read_events: 999999999, successful_reads: 3, failed_reads: 1 }] } } } }), { status: 200 });
  const response = await createResourcesHandler(analytics)(new Request("https://trackmcp.test/api/v2/resources"));
  const body = await response.json();
  assert.equal(body.coverage.level, "entity_read_projection");
  assert.deepEqual(body.observed.entity_analytics.transport_breakdown, [{ transport: "unknown", read_events: 1000000, successful_reads: 3, failed_reads: 1 }]);
});
