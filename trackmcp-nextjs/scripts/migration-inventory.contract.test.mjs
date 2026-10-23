import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = path.resolve(process.cwd(), "..");
const migrationRoot = path.join(repoRoot, "supabase", "migrations");
const migrationFiles = fs.readdirSync(migrationRoot)
  .filter((name) => name.endsWith(".sql"))
  .sort();

test("migration inventory has deterministic names and no duplicate executable versions", () => {
  assert.ok(migrationFiles.length > 0, "the repository must carry migrations");
  const versions = new Map();
  for (const name of migrationFiles) {
    assert.match(name, /^\d{14}_[a-z0-9_]+\.sql$/, `invalid migration filename: ${name}`);
    const version = name.slice(0, 14);
    const content = fs.readFileSync(path.join(migrationRoot, name), "utf8");
    const bucket = versions.get(version) || [];
    bucket.push({ name, content });
    versions.set(version, bucket);
  }

  for (const [version, entries] of versions) {
    if (entries.length === 1) continue;
    for (const { name, content } of entries) {
      const header = content.split(/\r?\n/).slice(0, 10).join(" ");
      assert.match(
        header,
        /review(?:ed|[- ]only)|apply manually|manual(?:ly)?/i,
        `duplicate migration version ${version} must be explicitly manual/review-only: ${name}`,
      );
    }
  }
});

test("migration inventory is ordered and contains no destructive table/column operations", () => {
  const sorted = [...migrationFiles].sort();
  assert.deepEqual(migrationFiles, sorted);
  for (const name of migrationFiles) {
    const content = fs.readFileSync(path.join(migrationRoot, name), "utf8");
    assert.doesNotMatch(content, /\b(?:drop\s+table|drop\s+column|truncate\s+(?:table\s+)?public\.)\b/i, `destructive schema operation requires an explicit release review: ${name}`);
  }
});
