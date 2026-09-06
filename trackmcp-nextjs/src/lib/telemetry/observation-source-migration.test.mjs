import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("observation provenance migration is forward-only, transactional, and idempotent", async () => {
  const path = new URL("../../../../supabase/migrations/20260907000008_observation_source.sql", import.meta.url);
  const sql = await readFile(path, "utf8");
  assert.match(sql, /begin;/i);
  assert.match(sql, /commit;/i);
  assert.match(sql, /add column if not exists observation_source text/i);
  assert.match(sql, /create index if not exists/i);
  assert.match(sql, /observation_source_check/i);
  assert.match(sql, /observation_source is null or observation_source in \('client', 'server'\)/i);
});
