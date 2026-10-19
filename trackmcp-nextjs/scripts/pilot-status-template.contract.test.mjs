import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd(), "..");
const doc = fs.readFileSync(path.join(root, "docs/FOUNDER-OS-PILOT-STATUS-TEMPLATE.md"), "utf8");

test("status template covers the complete incident lifecycle", () => {
  for (const phrase of ["Investigating", "Mitigating", "Monitoring", "Resolved", "Started (UTC)", "Recovery evidence"]) {
    assert.ok(doc.toLowerCase().includes(phrase.toLowerCase()), `missing status phase: ${phrase}`);
  }
});

test("status template keeps claims evidence-based and secret-safe", () => {
  for (const phrase of ["verified facts", "API keys", "raw telemetry", "specific safe check", "Never claim complete recovery"]) {
    assert.ok(doc.toLowerCase().includes(phrase.toLowerCase()), `missing status safety rule: ${phrase}`);
  }
  assert.doesNotMatch(doc, /paste.*(api key|device code).*support/i);
});
