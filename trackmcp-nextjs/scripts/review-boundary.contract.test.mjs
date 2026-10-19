import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(process.cwd(), "..");
const ledger = fs.readFileSync(path.join(root, "FOUNDER-OS-REVIEW-BOUNDARY.md"), "utf8");
const scope = JSON.parse(execFileSync(process.execPath, ["scripts/release-scope-audit.mjs", "--json"], { encoding: "utf8" }));

test("every current review-required path has an accountable boundary record", () => {
  const reviewPaths = scope.files.filter((row) => row.classification === "review-required").map((row) => row.file);
  for (const file of reviewPaths) {
    assert.ok(ledger.includes(`| \`${file}\` | review-required |`), `missing review boundary for ${file}`);
  }
});

test("review ledger requires owner, reviewer, and disposition", () => {
  assert.match(ledger, /\| Owner \| Required reviewer \| Disposition \|/);
  assert.match(ledger, /instruction-only formatting change; exclude/);
  assert.match(ledger, /must be added here with an owner, reviewer, and\s+disposition/);
});
