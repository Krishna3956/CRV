import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath = new URL("../../supabase/migrations/20260906000007_intent_capability.sql", import.meta.url);
const manualPath = new URL("../../supabase/manual/20260906000007_intent_capability.sql", import.meta.url);

test("P1-02 migration is additive and has bounded intent constraints", async () => {
  const sql = await readFile(migrationPath, "utf8");
  for (const column of ["context", "intent_source", "missing_capability"]) assert.match(sql, new RegExp(`add column if not exists ${column}`));
  assert.match(sql, /context_parameter/);
  assert.match(sql, /external_callback/);
  assert.match(sql, /octet_length\(context\) between 1 and 2048/);
  assert.match(sql, /octet_length\(missing_capability\) between 1 and 2048/);
  assert.doesNotMatch(sql, /\b(drop|delete|truncate)\b/i);
});

test("manual SQL Editor script is transactional and does not replay prior history", async () => {
  const sql = await readFile(manualPath, "utf8");
  assert.match(sql, /^begin;/m);
  assert.match(sql, /^commit;/m);
  assert.match(sql, /to_regclass\('public\.trackmcp_events'\)/);
  assert.match(sql, /add column if not exists context/);
  assert.doesNotMatch(sql, /supabase db push|20260829000000|2026090600000[4-6]/i);
});
