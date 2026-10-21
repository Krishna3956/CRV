import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(process.cwd(), "..");
const readiness = await readFile(resolve(root, "docs/FOUNDER-OS-PACKAGE-RELEASE-READINESS.md"), "utf8");
const plan = await readFile(resolve(root, "docs/FOUNDER-OS-100-CUSTOMER-PILOT-MASTER-EXECUTION-PLAN.md"), "utf8");

test("package readiness distinguishes local package checks from registry publication", () => {
  for (const term of [
    "`@trackmcp/sdk@0.1.4`",
    "Must receive a new approved version, publication, provenance, and exact-registry consumer test",
    "`@trackmcp/cli@0.1.4`",
    "disposable production activation proof",
    "`trackmcp==0.1.4`",
    "PyPI upload, artifact check, and exact-registry consumer test",
    "not attest to a future candidate",
  ]) assert.match(readiness, new RegExp(term.replace(/[()[\].+?^$|{}\\]/g, "\\$&")));
});

test("master plan keeps changed SDK publication and final claims as open gates", () => {
  assert.match(plan, /TypeScript and Python SDK source paths differ/);
  assert.match(plan, /\[ \] Publish changed package code only under a new approved version\./);
  assert.match(plan, /\[ \] Repeat the public-claim review against the final published package/);
});
