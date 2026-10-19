import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath = new URL("../../../../supabase/migrations/20261018000002_account_identity_contract.sql", import.meta.url);

test("account identity migration is additive and bounded", async () => {
  const sql = await readFile(migrationPath, "utf8");
  assert.match(sql, /add column if not exists account_key text/i);
  assert.match(sql, /add column if not exists account_identity_source text/i);
  assert.match(sql, /account_identity_source.*resolver.*unresolved/is);
  assert.match(sql, /account_key.*\[0-9a-f\]\{64\}/is);
  assert.match(sql, /workspace_id, account_key, started_at/i);
  assert.doesNotMatch(sql, /\b(drop|truncate|delete)\s+(table|schema|from|database)\b/i);
});
