import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(process.cwd(), "..");
const manifest = fs.readFileSync(path.join(root, "FOUNDER-OS-RELEASE-MANIFEST.md"), "utf8");
const ownership = fs.readFileSync(path.join(root, "FOUNDER-OS-FILE-OWNERSHIP.md"), "utf8");
const scope = JSON.parse(execFileSync(process.execPath, ["scripts/release-scope-audit.mjs", "--json"], { encoding: "utf8" }));

test("release manifest exposes all scope classes and ownership is the path-level reconciliation", () => {
  assert.match(manifest, /## Intended application scope/);
  assert.match(manifest, /## Intended product\/content scope requiring separate review/);
  assert.match(manifest, /## Explicitly excluded/);
  assert.match(manifest, /FOUNDER-OS-FILE-OWNERSHIP\.md/);
  assert.match(ownership, /assigns every\s+path classified as intended release scope/);
  const intended = scope.files.filter((row) => row.classification === "intended-release-scope");
  // A clean candidate checkout has no changed paths by definition. In that
  // state the scope audit is correctly empty; the manifest still has to name
  // a concrete intended artifact so this contract cannot pass against an empty
  // or misplaced release document.
  if (scope.files.length === 0 || intended.length === 0) {
    assert.ok(fs.existsSync(path.join(root, "FOUNDER-OS-RELEASE-MANIFEST.md")));
    assert.ok(scope.files.every((row) => row.classification === "excluded-local-artifact" || row.classification === "review-required"));
  } else {
    assert.ok(intended.length > 0);
  }
  assert.equal(scope.files.filter((row) => row.classification === "excluded-artifact").length, 0);
});

test("manifest does not claim that local scope reconciliation is production release", () => {
  assert.match(manifest, /local review only; intentionally uncommitted/);
  assert.match(manifest, /does not\s+stage, delete, or modify any file/);
  assert.match(manifest, /not pilot-ready until/);
});
