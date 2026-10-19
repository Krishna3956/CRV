import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const runbook = await readFile(resolve(process.cwd(), "../docs/FOUNDER-OS-100-CUSTOMER-PILOT-RUNBOOK.md"), "utf8");

test("pilot runbook maps every open queue group to an evidence-producing step", () => {
  for (const marker of [
    "020, 259–260",
    "045–049, 051–054",
    "141–148, 156–157",
    "178–179, 257–258",
    "249–250",
    "251, 255",
    "256",
    "non-empty disposable",
    "4xx/5xx/transport split",
  ]) assert.match(runbook, new RegExp(marker.replace(/[()[\].+?^$|{}\\]/g, "\\$&")));
});

test("pilot runbook does not relabel a changing local baseline as release evidence", () => {
  assert.doesNotMatch(runbook, /clean 102-suite gate|clean 104-suite release gate/i);
  assert.match(runbook, /Record the actual command output, candidate SHA, UTC timestamp/);
  assert.match(runbook, /A local pass never\s+substitutes for production evidence/);
});
