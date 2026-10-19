import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd(), "..");
const doc = fs.readFileSync(path.join(root, "docs/FOUNDER-OS-PRIVACY-DELETION-WORKER-REVIEW.md"), "utf8");

test("deletion worker review covers safety gates, lifecycle, and recovery", () => {
  for (const phrase of ["legal hold", "second approver", "State machine", "500 rows per batch", "idempotency", "lease owner", "postflight", "disposable"]) {
    assert.ok(doc.toLowerCase().includes(phrase.toLowerCase()), `missing deletion review control: ${phrase}`);
  }
});

test("deletion worker review remains design-only and secret-safe", () => {
  for (const phrase of ["design only", "execution closed", "canExecutePrivacyDeletionPlan", "remains false", "ad-hoc destructive SQL"]) {
    assert.ok(doc.toLowerCase().includes(phrase.toLowerCase()), `missing deletion safety boundary: ${phrase}`);
  }
  assert.doesNotMatch(doc, /\b(insert into|update\s+public|delete from|truncate table)\b/i);
  assert.match(doc, /Never record keys|Never record only request ID|Never record/i);
});
