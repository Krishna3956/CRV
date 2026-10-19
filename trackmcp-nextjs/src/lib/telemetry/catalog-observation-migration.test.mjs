import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("catalog observation migration is additive and stores only bounded hashes", async () => {
  const sql = await readFile(new URL("../../../../supabase/migrations/20261018000005_catalog_observation_contract.sql", import.meta.url), "utf8");
  assert.match(sql, /add column if not exists catalog_kind/);
  assert.match(sql, /catalog_item_count between 0 and 1000000/);
  assert.match(sql, /jsonb_array_length\(catalog_item_name_hashes\) <= 128/);
  assert.match(sql, /pg_column_size\(catalog_item_name_hashes\) <= 16384/);
  assert.doesNotMatch(sql, /delete from|drop table|truncate table|update public\.trackmcp_events/i);
});
