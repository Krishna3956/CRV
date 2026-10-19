import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const sqlUrl = new URL("../../supabase/manual/founder-os-worker-health-postflight.sql", import.meta.url);

test("worker health postflight reports bounded queue health without secrets", async () => {
  const sql = await readFile(sqlUrl, "utf8");
  const executable = sql.replace(/--[^\n]*\n/g, "\n");
  assert.match(executable, /from public\.trackmcp_refresh_jobs/);
  assert.match(executable, /from public\.trackmcp_action_queue/);
  for (const field of ["due_jobs", "expired_leases", "retryable_jobs", "failed_jobs", "max_due_age_ms", "oldest_item_age_ms"]) {
    assert.match(executable, new RegExp(`\\bas ${field}\\b`));
  }
  assert.doesNotMatch(executable, /api[_-]?key|lease_owner|last_error_detail|payload/i);
});

test("worker health postflight is read-only", async () => {
  const sql = (await readFile(sqlUrl, "utf8"))
    .replace(/--[^\n]*\n/g, "\n")
    .replace(/\/\*[\s\S]*?\*\//g, "\n");
  assert.doesNotMatch(sql, /\b(insert|update|delete|alter|drop|truncate|create)\s+/i);
});

