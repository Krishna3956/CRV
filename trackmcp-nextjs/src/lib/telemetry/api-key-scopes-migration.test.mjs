import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath = new URL("../../../../supabase/migrations/20261021000001_api_key_scopes.sql", import.meta.url);
const postflightPath = new URL("../../../../supabase/manual/founder-os-api-key-scopes-postflight.sql", import.meta.url);

test("connection-key scopes are additive, bounded, nullable, and indexed", async () => {
  const sql = await readFile(migrationPath, "utf8");
  assert.match(sql, /add column if not exists service_scope text/i);
  assert.match(sql, /add column if not exists environment_scope text/i);
  assert.match(sql, /workspace_scope_idx/i);
  assert.match(sql, /service_scope.*char_length\(service_scope\) between 1 and 100/i);
  assert.match(sql, /environment_scope.*char_length\(environment_scope\) between 1 and 64/i);
  assert.doesNotMatch(sql, /\b(drop|truncate|delete)\s+(table|schema|from|database)\b/i);
  assert.doesNotMatch(sql, /\b(insert|update)\s+into\b/i);
});

test("connection-key scope postflight is read-only and checks the deployed contract", async () => {
  const sql = await readFile(postflightPath, "utf8");
  assert.match(sql, /information_schema\.columns/i);
  assert.match(sql, /trackmcp_api_keys_workspace_scope_idx/i);
  assert.match(sql, /invalid_service_scopes/i);
  assert.doesNotMatch(sql, /(?:^|;)\s*(?:insert|update|delete|truncate|create|alter|drop|grant|revoke)\b/im);
});
