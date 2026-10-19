import assert from "node:assert/strict";
import test from "node:test";
import { projectTrackMCPFact } from "./facts.ts";
import { aggregateTaskLifecycles } from "./task-lifecycle.ts";
import type { CanonicalTrackMCPEvent } from "./types.ts";

const event = (status: string, started_at: string): CanonicalTrackMCPEvent => ({
  schema_version: "1", event_id: `event-${status}-${started_at}`, event_type: "protocol", service: "server", environment: "production",
  observation_source: "server", task_id: "raw-task-id", mcp_method: "tasks/get", started_at, payload: { status },
});

test("task projection hashes task IDs and exposes explicit lifecycle state", () => {
  const facts = [projectTrackMCPFact(event("working", "2026-10-19T00:00:00Z")), projectTrackMCPFact(event("completed", "2026-10-19T00:01:00Z"))];
  assert.equal(facts[0]!.dimensions.task_id_hash?.length, 64);
  assert.equal(JSON.stringify(facts).includes("raw-task-id"), false);
  const [task] = aggregateTaskLifecycles(facts);
  assert.equal(task?.state, "completed");
  assert.equal(task?.terminal, true);
  assert.equal(task?.observations, 2);
});

test("missing task status remains unknown and no inactivity is inferred", () => {
  const fact = projectTrackMCPFact({ ...event("working", "2026-10-19T00:00:00Z"), payload: undefined });
  const [task] = aggregateTaskLifecycles([fact]);
  assert.equal(task?.state, "unknown");
  assert.equal(task?.terminal, false);
});
