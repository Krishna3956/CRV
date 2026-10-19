import assert from "node:assert/strict";
import test from "node:test";
import { projectTrackMCPFact } from "./facts.ts";
import { aggregateTrackMCPFacts, aggregateTrackMCPFactsBy } from "./outcomes.ts";
import type { CanonicalTrackMCPEvent } from "./types.ts";

const event = (overrides: Partial<CanonicalTrackMCPEvent> = {}): CanonicalTrackMCPEvent => ({
  schema_version: "1", event_id: crypto.randomUUID(), event_type: "tool_call", service: "svc", environment: "prod",
  observation_source: "server", started_at: "2026-10-18T00:00:00Z", ...overrides,
});
const facts = (...events: CanonicalTrackMCPEvent[]) => events.map(projectTrackMCPFact);

test("keeps unresolved outcomes visible and uses null for unavailable rates", () => {
  const aggregate = aggregateTrackMCPFacts(facts(event(), event({ event_id: "pending", event_type: "workflow", payload: { name: "workflow", status: "pending" } })));
  assert.equal(aggregate.total_facts, 2);
  assert.equal(aggregate.outcomes.unknown, 1);
  assert.equal(aggregate.outcomes.pending, 1);
  assert.equal(aggregate.unresolved_facts, 2);
  assert.equal(aggregate.error_rate, null);
  assert.equal(aggregate.workflow_completion_rate, null);
});

test("calculates terminal error and workflow completion rates conservatively", () => {
  const aggregate = aggregateTrackMCPFacts(facts(
    event({ event_type: "tool_call", success: true }),
    event({ event_id: "failed", event_type: "tool_call", success: false }),
    event({ event_id: "done", event_type: "workflow", payload: { name: "workflow", status: "completed" } }),
    event({ event_id: "wf-fail", event_type: "workflow", payload: { name: "workflow", status: "failed" } }),
    event({ event_id: "wf-unknown", event_type: "workflow" }),
  ));
  assert.equal(aggregate.error_rate, 0.5);
  assert.equal(aggregate.workflow_completion_rate, 0.5);
  assert.equal(aggregate.outcomes.unknown, 1);
});

test("groups by safe dimensions and puts missing dimensions in unknown", () => {
  const grouped = aggregateTrackMCPFactsBy(facts(
    event({ event_id: "a", client_name: "Alpha", success: true }),
    event({ event_id: "b", client_name: "Alpha", success: false }),
    event({ event_id: "c", client_name: undefined, success: true }),
  ), "client_name");
  assert.deepEqual(grouped.map((item) => item.group_key), ["Alpha", "unknown"]);
  assert.equal(grouped[0]?.total_facts, 2);
  assert.equal(grouped[1]?.total_facts, 1);
});
