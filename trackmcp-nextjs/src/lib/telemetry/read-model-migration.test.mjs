import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath = new URL("../../../../supabase/migrations/20261018000003_founder_os_read_model.sql", import.meta.url);

test("Founder OS read-model migration is additive and bounded", async () => {
  const sql = await readFile(migrationPath, "utf8");
  assert.match(sql, /create table if not exists public\.trackmcp_semantic_facts/i);
  assert.match(sql, /create table if not exists public\.trackmcp_action_queue/i);
  assert.match(sql, /primary key \(workspace_id, source_event_id, fact_version\)/i);
  assert.match(sql, /unique \(workspace_id, fingerprint\)/i);
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /revoke all on public\.trackmcp_semantic_facts/i);
  assert.match(sql, /revoke all on public\.trackmcp_action_queue/i);
  assert.doesNotMatch(sql, /\b(drop|truncate|delete)\s+(table|schema|from|database)\b/i);
  assert.doesNotMatch(sql, /\b(insert|update)\s+into\b/i);
});
