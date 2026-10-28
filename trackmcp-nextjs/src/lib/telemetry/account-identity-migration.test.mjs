import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const contractMigration = await readFile(new URL("../../../../supabase/migrations/20261018000002_account_identity_contract.sql", import.meta.url), "utf8");
const versionMigration = await readFile(new URL("../../../../supabase/migrations/20261029000002_account_identity_version.sql", import.meta.url), "utf8");

test("account identity migration is additive and bounded", () => {
  assert.match(contractMigration, /add column if not exists account_key text/i);
  assert.match(contractMigration, /add column if not exists account_identity_source text/i);
  assert.match(contractMigration, /account_identity_source.*resolver.*unresolved/is);
  assert.match(contractMigration, /account_key.*\[0-9a-f\]\{64\}/is);
  assert.match(contractMigration, /workspace_id, account_key, started_at/i);
  assert.doesNotMatch(contractMigration, /\b(drop|truncate|delete)\s+(table|schema|from|database)\b/i);
});

test("account identity version migration is additive, backfills only the current namespace, and blocks mixed pairs", () => {
  assert.match(versionMigration, /add column if not exists account_identity_version text/);
  assert.match(versionMigration, /set account_identity_version = 'sha256-v1'/);
  assert.match(versionMigration, /where account_key is not null and account_identity_version is null/);
  assert.match(versionMigration, /account_key is null and account_identity_version is null/);
  assert.match(versionMigration, /account_key is not null and account_identity_version = 'sha256-v1'/);
  assert.match(versionMigration, /workspace_account_identity_started_idx/);
  assert.doesNotMatch(versionMigration, /drop table|truncate/i);
});
