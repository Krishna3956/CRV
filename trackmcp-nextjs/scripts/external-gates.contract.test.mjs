import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const register = await readFile(new URL("../../docs/FOUNDER-OS-100-CUSTOMER-PILOT-EXTERNAL-GATES.md", import.meta.url), "utf8");

test("first-100 external-gate register stays an explicit HOLD record", () => {
  assert.match(register, /Status:\s*\*\*HOLD\*\*/);
  assert.match(register, /Updated:\s*2026-10-27/);
  assert.match(register, /main.*29096bc/s);
  assert.match(register, /141 suites/);
  assert.match(register, /177-route/);
  assert.match(register, /do not change the application image|does not change the deployed image/i);
});

test("all operator and infrastructure gates remain named and open until evidence closes them", () => {
  for (const gate of ["020", "157", "260", "Privacy lifecycle acceptance", "Synthetic reliability-data hygiene", "Refresh scheduler enablement"]) {
    assert.ok(register.includes(gate), `missing gate: ${gate}`);
  }
  assert.match(register, /A gate becomes closed only\s+when the named evidence is retained/i);
});
