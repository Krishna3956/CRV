import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(process.cwd(), "..");
const doc = fs.readFileSync(path.join(root, "FOUNDER-OS-ROLLBACK-PLAN.md"), "utf8");

test("rollback plan requires immutable release evidence", () => {
  for (const field of ["reviewed_commit_sha", "deployed_commit_sha", "rollback_commit_sha", "deployed_image_digest", "rollback_image_digest", "schema_postflight_reference", "owner_and_timestamp"]) {
    assert.match(doc, new RegExp(`\\| ${field} \\|`));
  }
  assert.match(doc, /sha256:/);
  assert.match(doc, /rollback_image_digest[^\n]*never `latest`/i);
});

test("rollback plan keeps schema changes additive and destructive actions out of scope", () => {
  assert.match(doc, /backward-compatible with the rollback\s+application/);
  assert.match(doc, /Destructive schema reversal/);
  assert.match(doc, /Manual deletion of customer rows or API keys/);
});
