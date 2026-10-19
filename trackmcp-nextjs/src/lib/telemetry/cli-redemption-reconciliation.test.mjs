import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const sql = await readFile(new URL("../../../../supabase/manual/founder-os-cli-redemption-reconciliation.sql", import.meta.url), "utf8");

test("CLI redemption reconciliation is read-only and never selects secrets", () => {
  const statements = sql.split("\n").filter((line) => !line.trim().startsWith("--")).join("\n");
  assert.doesNotMatch(statements, /^\s*(insert|update|delete|alter|drop|create|grant|revoke)\b/im);
  assert.match(sql, /stale_redeeming_count/);
  assert.match(sql, /created_key_id/);
  assert.doesNotMatch(sql, /\b(api_key|key_hash|device_code|user_code)\b\s*[,)]/i);
  assert.match(sql, /is distinct from/);
});
