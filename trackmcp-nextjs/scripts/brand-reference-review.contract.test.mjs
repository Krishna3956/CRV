import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(process.cwd(), "..");
const review = await readFile(resolve(root, "docs/FOUNDER-OS-BRAND-REFERENCE-REVIEW.md"), "utf8");
const plan = await readFile(resolve(root, "docs/FOUNDER-OS-100-CUSTOMER-PILOT-MASTER-EXECUTION-PLAN.md"), "utf8");
const normalizedReview = review.replace(/\s+/g, " ");
const normalizedPlan = plan.replace(/\s+/g, " ");

test("brand reference review does not invent an approved logo from the Word reference", () => {
  assert.match(normalizedReview, /not as an instruction source/);
  assert.match(normalizedReview, /did not identify a stand-alone, unambiguous Founder OS logo asset/i);
  assert.match(normalizedReview, /No code or public asset was changed during this review/);
  assert.match(normalizedReview, /approved, separately supplied source asset/);
  assert.match(normalizedReview, /named owner decision/);
});

test("pilot plan keeps any branding release dependent on an approved mark", () => {
  assert.match(normalizedPlan, /no mark was recreated or changed by inference/i);
  assert.match(normalizedPlan, /\[ \] Obtain an approved source asset or named owner decision/);
});
