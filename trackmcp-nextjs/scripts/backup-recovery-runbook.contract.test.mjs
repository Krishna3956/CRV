import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const runbook = await readFile(new URL("../../docs/FOUNDER-OS-BACKUP-RECOVERY-RUNBOOK.md", import.meta.url), "utf8");

test("backup runbook does not claim Free-plan backup or PITR coverage", () => {
  assert.match(runbook, /Free plan/i);
  assert.match(runbook, /no usable scheduled backup, PITR restore point/i);
  assert.match(runbook, /does not execute a\s+Supabase migration/i);
  assert.match(runbook, /must continue to show \*\*HOLD\*\*/i);
});

test("backup runbook requires a disposable restore rehearsal and postflights", () => {
  assert.match(runbook, /Disposable restore rehearsal/);
  assert.match(runbook, /founder-os-complete-postflight\.sql/);
  assert.match(runbook, /refresh-worker health postflight/);
  assert.match(runbook, /workspace isolation/);
  assert.match(runbook, /RPO\/RTO/);
});

test("backup runbook forbids secrets and raw customer payloads in evidence", () => {
  assert.match(runbook, /never place it in shell history, `\.env`, GitHub logs/i);
  assert.match(runbook, /Secrets, API keys, bearer tokens, cookies,\s+device codes/);
  assert.match(runbook, /Never replay raw\s+payloads outside the approved ingestion path/);
});
