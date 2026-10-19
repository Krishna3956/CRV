import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("action queue lifecycle migration is additive and bounded", async () => {
  const sql = await readFile(new URL("../../../../supabase/migrations/20261018000004_action_queue_lifecycle.sql", import.meta.url), "utf8");
  assert.match(sql, /alter table public\.trackmcp_action_queue/i);
  for (const column of ["acknowledged_at", "snoozed_until", "resolved_by", "resolution_note", "updated_at", "revision"]) assert.match(sql, new RegExp(`add column if not exists ${column}`, "i"));
  assert.match(sql, /char_length\(resolution_note\) <= 500/i);
  assert.match(sql, /revision > 0/i);
  assert.match(sql, /trackmcp_action_queue_snoozed_until_idx/i);
  const executableSql = sql.replace(/--.*$/gm, "");
  assert.doesNotMatch(executableSql, /\b(drop|delete|truncate|backfill)\b/i);
});
