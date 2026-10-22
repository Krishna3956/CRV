import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd(), "..");
const doc = fs.readFileSync(path.join(root, "docs/FOUNDER-OS-PILOT-SCOPE.md"), "utf8");

test("pilot scope classifies supported, limited, and out-of-scope capabilities", () => {
  for (const phrase of ["supported", "limited", "out of scope", "Terminal-first CLI activation", "Python SDK", "OTLP/HTTP JSON or protobuf", "Production scheduler SLOs"]) {
    assert.ok(doc.toLowerCase().includes(phrase.toLowerCase()), `missing scope classification: ${phrase}`);
  }
});

test("pilot scope does not overclaim production evidence or install hooks", () => {
  for (const phrase of ["production/operator evidence", "npm install", "pip install", "remains silent", "not claimed", "rollback"]) {
    assert.ok(doc.toLowerCase().includes(phrase.toLowerCase()), `missing scope safety boundary: ${phrase}`);
  }
  assert.doesNotMatch(doc, /automatically authenticates during (npm|pip) install/i);
});
