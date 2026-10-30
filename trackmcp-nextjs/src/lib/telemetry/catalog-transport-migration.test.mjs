import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migration = await readFile(new URL("../../../../supabase/migrations/20261030000001_catalog_transport_scope.sql", import.meta.url), "utf8");

test("catalog transport migration backfills an explicit unknown label and scopes uniqueness", () => {
  assert.match(migration, /add column if not exists transport text not null default 'unknown'/i);
  assert.match(migration, /set transport = 'unknown'/i);
  assert.match(migration, /transport in \('stdio', 'streamable_http', 'sse', 'custom', 'unknown'\)/i);
  assert.match(migration, /unique \(\s*workspace_id,\s*server_id,\s*environment_id,\s*transport,\s*catalog_kind,\s*snapshot_hash\s*\)/is);
  assert.match(migration, /trackmcp_catalog_versions_transport_scope_idx/i);
});
