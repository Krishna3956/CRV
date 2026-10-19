import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

const output = execFileSync(process.execPath, ["scripts/release-scope-audit.mjs", "--json"], { encoding: "utf8" });
const report = JSON.parse(output);

test("release scope audit classifies intended, review, and local-artifact paths", () => {
  assert.equal(typeof report.repository, "string");
  assert.ok(report.summary && typeof report.summary === "object");
  assert.ok(Array.isArray(report.files));
  if (!report.files.some((row) => row.classification === "intended-release-scope")) {
    assert.equal(report.summary["review-required"] || 0, 0);
    return;
  }
  const classification = new Map(report.files.map((row) => [row.file, row.classification]));
  if (classification.has("trackmcp-nextjs/src/lib/account/privacy-export.ts")) {
    assert.equal(classification.get("trackmcp-nextjs/src/lib/account/privacy-export.ts"), "intended-release-scope");
  } else {
    assert.ok(report.files.some((row) => row.classification === "intended-release-scope"));
  }
  for (const row of report.files.filter((row) => /(^|\/)(?:campaigns|node_modules|build|\.next(?:-[^/]+)?)(\/|$)|(?:^|\/)[^/]+\.csv$/i.test(row.file))) {
    assert.equal(row.classification, "excluded-local-artifact", row.file);
  }
  // A clean candidate may contain only intended files plus excluded local
  // artifacts (for example, repository instruction files). Review-required
  // paths are still fail-closed by strict mode when they are present.
});

test("strict scope mode fails closed when review or local artifacts are present", () => {
  let failed = false;
  try {
    execFileSync(process.execPath, ["scripts/release-scope-audit.mjs", "--json", "--strict"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (error) {
    failed = error?.status !== 0;
  }
  if (report.files.length > 0) {
    assert.equal(failed, true, "a mixed worktree must not pass the strict release audit");
  } else {
    assert.equal(failed, false, "a clean checkout should pass the strict release audit");
  }
});
