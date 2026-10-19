import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

const report = JSON.parse(execFileSync(process.execPath, ["scripts/secret-scope-audit.mjs", "--json", "--strict"], { encoding: "utf8" }));

test("intended scope has no unexpected credential-shaped values", () => {
  if (report.scanned_intended_paths === 0) {
    assert.deepEqual(report.findings, []);
    return;
  }
  assert.ok(report.scanned_intended_paths > 0);
  assert.deepEqual(report.findings, []);
});

test("fixture matches are bounded to safe test/example contexts", () => {
  for (const finding of report.fixtures) assert.match(finding.file, /(?:test|spec|fixture|example|docs|README|deploy|harness)/i);
});

test("device and redemption identifiers are either approved fixtures or unexpected findings", () => {
  const sensitiveKinds = new Set(["device-code", "user-code", "redemption-id"]);
  const matches = [...report.fixtures, ...report.findings].filter((finding) => sensitiveKinds.has(finding.kind));
  if (report.scanned_intended_paths === 0) {
    assert.equal(matches.length, 0);
    return;
  }
  if (matches.length === 0) {
    assert.deepEqual(report.findings.filter((finding) => sensitiveKinds.has(finding.kind)), []);
    return;
  }
  assert.deepEqual(report.findings.filter((finding) => sensitiveKinds.has(finding.kind)), []);
});
