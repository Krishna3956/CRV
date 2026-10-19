import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../../supabase/manual/founder-os-complete-production-audit.sql", import.meta.url), "utf8");
const compactSource = await readFile(new URL("../../supabase/manual/founder-os-production-audit.sql", import.meta.url), "utf8");

test("complete production audit includes the catalog entity projection and workspace uniqueness", () => {
  assert.match(source, /trackmcp_catalog_entity_reads/);
  assert.match(source, /trackmcp_catalog_versions_snapshot_hash_idx/);
  assert.match(source, /trackmcp_catalog_entity_reads_scope_idx/);
  assert.match(source, /trackmcp_catalog_entity_reads_hash_idx/);
  assert.match(source, /invalid_catalog_entity_reads/);
  assert.match(source, /entity_hash is null/);
  assert.match(source, /catalog_kind is null/);
});

test("complete production audit remains read-only", () => {
  const sql = source.replace(/--.*$/gm, "");
  assert.doesNotMatch(sql, /\b(insert|update|delete|truncate|create|alter|drop|grant|revoke)\b/i);
  assert.match(source, /to_regclass\(/);
  assert.match(source, /information_schema\.columns/);
  assert.match(source, /c\.relnamespace = \(select oid from pg_namespace where nspname = 'public'\)/);
});

test("compact production audit keeps the same catalog entity boundary", () => {
  assert.match(compactSource, /trackmcp_catalog_entity_reads/);
  assert.match(compactSource, /trackmcp_catalog_entity_reads_scope_idx/);
  assert.match(compactSource, /trackmcp_catalog_entity_reads_hash_idx/);
  assert.match(compactSource, /trackmcp_catalog_entity_reads','created_at'/);
  assert.match(compactSource, /invalid_catalog_entity_reads/);
  assert.match(compactSource, /entity_hash is null/);
  assert.match(compactSource, /catalog_kind is null/);
  assert.match(compactSource, /c\.relnamespace = \(select oid from pg_namespace where nspname = 'public'\)/);
  const sql = compactSource.replace(/--.*$/gm, "");
  assert.doesNotMatch(sql, /\b(insert|update|delete|truncate|create|alter|drop|grant|revoke)\b/i);
});
