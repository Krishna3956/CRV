import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(process.cwd(), "..");
const doc = fs.readFileSync(path.join(root, "FOUNDER-OS-EVIDENCE-RECORD.md"), "utf8");

test("evidence record requires accountable, reproducible gate fields", () => {
  for (const field of ["gate_id", "owner", "timestamp_utc", "command_or_probe", "environment", "candidate_sha", "result", "evidence_reference", "caveat_or_scope"]) {
    assert.match(doc, new RegExp(`\\| ${field} \\|`));
  }
});

test("evidence record keeps secrets and scope claims bounded", () => {
  assert.match(doc, /never paste API keys, bearer tokens, device codes/);
  assert.match(doc, /local pass must not be relabeled as CI or production/);
  assert.match(doc, /A blocked or not-run gate stays open/);
});
