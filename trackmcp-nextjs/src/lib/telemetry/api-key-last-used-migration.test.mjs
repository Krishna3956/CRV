import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const migration = fs.readFileSync(path.resolve(process.cwd(), "../supabase/migrations/20261024000002_api_key_last_used_at.sql"), "utf8");

test("API-key last-use migration is additive and secret-free", () => {
  assert.match(migration, /add column if not exists last_used_at timestamptz/i);
  assert.match(migration, /workspace_id, last_used_at desc/i);
  assert.match(migration, /comment on column public\.trackmcp_api_keys\.last_used_at/i);
  assert.doesNotMatch(migration, /key_hash\s*=/i);
});
