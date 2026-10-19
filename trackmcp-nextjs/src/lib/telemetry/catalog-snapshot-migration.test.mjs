import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("catalog snapshot migration is additive, bounded, and hash-only", async () => {
  const sql = await readFile(new URL("../../../../supabase/migrations/20261018000008_catalog_snapshot_versions.sql", import.meta.url), "utf8");
  assert.match(sql, /alter table public\.trackmcp_catalog_versions/);
  assert.match(sql, /add column if not exists snapshot_hash/);
  assert.match(sql, /add column if not exists previous_snapshot_id/);
  assert.match(sql, /item_count between 0 and 1000000/);
  assert.match(sql, /jsonb_array_length\(item_name_hashes\) <= 128/);
  assert.match(sql, /jsonb_array_length\(item_uri_hashes\) <= 128/);
  assert.match(sql, /pg_column_size\(diff\) <= 8192/);
  assert.match(sql, /foreign key \(previous_snapshot_id\)/i);
  assert.doesNotMatch(sql, /delete from|drop table|truncate table|update public\./i);
});

test("snapshot migration does not grant browser table access", async () => {
  const sql = await readFile(new URL("../../../../supabase/migrations/20261018000008_catalog_snapshot_versions.sql", import.meta.url), "utf8");
  assert.doesNotMatch(sql, /grant\s+select\s+on\s+public\.trackmcp_catalog_versions\s+to\s+(anon|authenticated)/i);
});
