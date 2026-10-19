import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const runbook = await readFile(resolve(process.cwd(), "../docs/FOUNDER-OS-INCIDENT-RESPONSE.md"), "utf8");

test("incident runbook covers every pilot degradation boundary", () => {
  for (const term of ["401/403", "429", "Ingest 5xx/latency", "Dashboard stale/partial", "Worker backlog/lag", "Database/RPC failure"]) {
    assert.match(runbook, new RegExp(term.replace(/[()[\].+?^$|{}\\]/g, "\\$&")));
  }
  assert.match(runbook, /x-trackmcp-rate-limit-mode/);
  assert.match(runbook, /data_trust/);
  assert.match(runbook, /lease fencing/);
  assert.match(runbook, /deployed SHA and image digest/);
});

test("incident runbook forbids unsafe diagnostic shortcuts", () => {
  assert.match(runbook, /does not run SQL, rotate keys, delete data,\s+or deploy/);
  assert.match(runbook, /Never record API keys, device codes, redemption IDs/);
  assert.match(runbook, /fail closed/);
  assert.match(runbook, /No failures observed.*not evidence/s);
});
