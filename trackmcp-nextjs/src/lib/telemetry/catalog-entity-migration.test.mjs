import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const migration = await readFile(resolve(process.cwd(), "../supabase/migrations/20261019000002_catalog_entity_reads.sql"), "utf8");
const postflight = await readFile(resolve(process.cwd(), "../supabase/manual/founder-os-catalog-entity-reads-postflight.sql"), "utf8");

test("catalog entity projection migration is additive, hash-only, and worker-only", () => {
  assert.match(migration, /create table if not exists public\.trackmcp_catalog_entity_reads/);
  assert.match(migration, /primary key \(workspace_id, source_event_id, catalog_kind, entity_hash\)/);
  assert.match(migration, /catalog_kind in \('resources', 'prompts'\)/);
  assert.match(migration, /entity_hash ~ '\^\[0-9a-f\]\{64\}\$'/);
  assert.match(migration, /revoke all on public\.trackmcp_catalog_entity_reads from anon, authenticated/);
  assert.match(migration, /catalog_entity_recompute/);
  assert.doesNotMatch(migration, /delete from|truncate|drop table|raw uri|raw name/i);
});

test("catalog entity postflight is read-only", () => {
  assert.match(postflight, /select/i);
  assert.match(postflight, /projected_reads/);
  assert.doesNotMatch(postflight, /insert into|update |delete from|truncate /i);
});
