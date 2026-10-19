import assert from "node:assert/strict";
import test from "node:test";
import {
  FOUNDER_OS_RETENTION_POLICY,
  FOUNDER_OS_RETENTION_POLICY_VERSION,
  getRetentionRule,
  retentionCutoff,
} from "./retention-policy.ts";

test("defines bounded defaults for every dataset", () => {
    assert.equal(FOUNDER_OS_RETENTION_POLICY_VERSION, "v1");
    assert.deepEqual(FOUNDER_OS_RETENTION_POLICY.map((rule) => rule.dataset), [
      "raw_events", "semantic_facts", "action_queue", "diagnostics",
    ]);
    for (const rule of FOUNDER_OS_RETENTION_POLICY) {
      assert.ok(rule.days > 0);
      assert.match(rule.table, /^[a-z][a-z0-9_]+$/);
    }
  });

test("calculates UTC cutoffs without mutating the input date", () => {
    const now = new Date("2026-10-18T12:00:00.000Z");
    const cutoff = retentionCutoff(now, "raw_events");
    assert.equal(cutoff.toISOString(), "2026-07-20T12:00:00.000Z");
    assert.equal(now.toISOString(), "2026-10-18T12:00:00.000Z");
    assert.equal(getRetentionRule("diagnostics").optional, true);
  });

