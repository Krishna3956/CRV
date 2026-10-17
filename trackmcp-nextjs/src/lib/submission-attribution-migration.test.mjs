import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationUrl = new URL("../../../supabase/migrations/20261018000000_submission_attribution.sql", import.meta.url);

test("submission attribution migration is nullable, bounded to JSON objects, and has no backfill", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  assert.match(sql, /add column if not exists submission_attribution jsonb/i);
  assert.match(sql, /submission_attribution is null or jsonb_typeof\(submission_attribution\) = 'object'/i);
  assert.doesNotMatch(sql, /update\s+public\.mcp_tools/i);
  assert.doesNotMatch(sql, /insert\s+into\s+public\.mcp_tools/i);
});
