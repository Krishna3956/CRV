import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const manualDir = path.resolve(process.cwd(), "../supabase/manual");
const names = (await readdir(manualDir))
  .filter((name) => name.endsWith(".sql"))
  .filter((name) => /audit|postflight/i.test(name))
  .filter((name) => !/repair/i.test(name))
  .sort();

test("reviewed manual audit/postflight SQL files are present", () => {
  assert.ok(names.length >= 10, `expected the reviewed manual SQL family, found ${names.length}`);
});

for (const name of names) {
  test(`${name} contains no top-level write statement`, async () => {
    const source = await readFile(path.join(manualDir, name), "utf8");
    const sql = source
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/--.*$/gm, "");
    assert.doesNotMatch(
      sql,
      /(?:^|;)\s*(?:insert|update|delete|truncate|create|alter|drop|grant|revoke)\b/im,
      `${name} must remain read-only; put mutations in a migration or explicitly named repair file`,
    );
  });
}
