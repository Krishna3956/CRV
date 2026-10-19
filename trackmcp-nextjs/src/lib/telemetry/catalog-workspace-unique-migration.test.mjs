import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migration = await readFile(new URL("../../../../supabase/migrations/20261019000003_catalog_workspace_unique_scope.sql", import.meta.url), "utf8");
const postflight = await readFile(new URL("../../../../supabase/manual/founder-os-catalog-workspace-unique-postflight.sql", import.meta.url), "utf8");

test("catalog snapshot uniqueness is workspace-scoped", () => {
  assert.match(migration, /drop index if exists public\.trackmcp_catalog_versions_snapshot_hash_idx/i);
  assert.match(migration, /workspace_id,\s*server_id,\s*environment_id,\s*catalog_kind,\s*snapshot_hash/s);
  assert.doesNotMatch(migration, /delete from|truncate table|update public\./i);
});

test("catalog uniqueness postflight is read-only and checks the scoped definition", () => {
  assert.match(postflight, /pg_indexes/);
  assert.match(postflight, /workspace_id, server_id, environment_id, catalog_kind, snapshot_hash/);
  assert.doesNotMatch(postflight, /\b(insert|update|delete|drop|truncate|alter)\b/i);
});
