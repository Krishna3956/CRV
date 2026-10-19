import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const sql = await readFile(new URL("../../../../supabase/migrations/20261018000011_catalog_workspace_scope.sql", import.meta.url), "utf8");

test("catalog workspace scope is additive and indexed", () => {
  assert.match(sql, /add column if not exists workspace_id uuid/i);
  assert.match(sql, /trackmcp_catalog_versions_workspace_scope_idx/);
  assert.doesNotMatch(sql, /delete from|truncate|drop table|update\s+public\./i);
});
