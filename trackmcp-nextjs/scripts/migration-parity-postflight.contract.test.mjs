import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = path.resolve(process.cwd(), "..");
const sql = await readFile(path.join(root, "supabase/manual/founder-os-migration-parity-postflight.sql"), "utf8");
const files = (await readdir(path.join(root, "supabase/migrations")))
  .filter((name) => name.endsWith(".sql"))
  .map((name) => name.slice(0, -4))
  .sort();

test("migration parity postflight manifest matches every repository migration", () => {
  const manifest = [...sql.matchAll(/\('([0-9]{14}_[a-z0-9_]+)'\)/g)].map((match) => match[1]).sort();
  assert.deepEqual(manifest, [...files, ...files].sort(), "the SQL repeats the manifest for detail and summary; both copies must stay in sync");
});

test("migration parity postflight is read-only and reports explicit missing rows", () => {
  const executable = sql.replace(/--.*$/gm, "");
  assert.doesNotMatch(executable, /\b(insert|update|delete|truncate|create|alter|drop|grant|revoke)\b/i);
  assert.match(sql, /ledger\.migration_version is not null as recorded/);
  assert.match(sql, /missing_count = 0 as parity_complete/);
  assert.match(sql, /requiring reviewed evidence/);
});
