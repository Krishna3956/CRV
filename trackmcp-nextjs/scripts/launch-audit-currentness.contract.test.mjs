import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const audit = await readFile(resolve(process.cwd(), "../FOUNDER-OS-LAUNCH-READINESS-AUDIT.md"), "utf8");

test("historical launch audit cannot be relabeled as approval for a later candidate", () => {
  const normalized = audit.replace(/\s+/g, " ");
  assert.match(normalized, /2026-10-19 \(historical release snapshot\)/);
  assert.match(normalized, /not approval for a later branch, package source change, image, schema state, or runtime configuration/);
  assert.match(normalized, /100-CUSTOMER-PILOT-MASTER-EXECUTION-PLAN\.md/);
  assert.match(normalized, /must not be copied into a current release record/);
  assert.match(normalized, /TypeScript and Python SDK source paths differ from their published registry artifacts/);
});
