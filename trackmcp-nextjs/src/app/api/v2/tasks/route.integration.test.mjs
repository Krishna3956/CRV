import assert from "node:assert/strict";
import test from "node:test";
import { createTasksHandler } from "./handlers.ts";

test("tasks route exposes bounded hashed lifecycle evidence without raw handles", async () => {
  const handler = createTasksHandler(async () => new Response(JSON.stringify({
    range_days: 30,
    founder_os: {
      tasks: [{
        task_id_hash: "a".repeat(64),
        state: "cancelled",
        first_observed_at: "2026-01-01T00:00:00Z",
        last_observed_at: "2026-01-01T00:01:00Z",
        observations: 4,
        terminal: true,
        evidence_quality: "observed",
        raw_task_id: "secret-task-handle",
      }],
    },
    data_trust: { source_count: 1 },
  }), { status: 200, headers: { "content-type": "application/json" } }));
  const response = await handler(new Request("https://example.test/api/v2/tasks"));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.task_count, 1);
  assert.equal(body.tasks[0].task_id_hash, "a".repeat(64));
  assert.equal(body.tasks[0].state, "cancelled");
  assert.equal(JSON.stringify(body).includes("secret-task-handle"), false);
  assert.match(body.caveats.join(" "), /does not prove the customer.*business outcome/);
});
