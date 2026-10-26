import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../../", import.meta.url);
const queue = await readFile(new URL("FOUNDER-OS-100-CUSTOMER-PILOT-WORK-QUEUE.md", root), "utf8");
const record = await readFile(new URL("docs/FOUNDER-OS-100-CUSTOMER-PILOT-RELEASE-RECORD.md", root), "utf8");
const externalGates = await readFile(new URL("docs/FOUNDER-OS-100-CUSTOMER-PILOT-EXTERNAL-GATES.md", root), "utf8");
const readinessLedger = await readFile(new URL("docs/FOUNDER-OS-100-CUSTOMER-READINESS-LEDGER.md", root), "utf8");

function openQueueIds(source) {
  return [...source.matchAll(/^- \[ \] (\d+)\b/gm)].map((match) => match[1]);
}

test("pilot release record points at the verified deployed baseline", () => {
  assert.match(record, /2e135f194f36e278232c6a46890b1ce850d1e9ba/);
  assert.match(record, /40198791603/);
  assert.doesNotMatch(record.split("## Release identity")[1].split("## Verified gates")[0], /aecbe2e|40131685736/);
});

test("pilot release record keeps unresolved operational gates explicit", () => {
  assert.match(record, /Database backup posture remains open/);
  assert.match(record, /Queue item 256 records the\s+release-specific rollback/);
  assert.match(record, /final operator go\/no-go decision/);
  assert.match(record, /40220255833/);
  assert.match(record, /iam:PassRole/);
});

test("release record preserves non-source acceptance decisions until an owner accepts them", () => {
  assert.match(record, /- \[ \] Privacy lifecycle behavior is reviewed for the pilot/);
  assert.match(record, /- \[ \] The stale synthetic reliability data is explicitly accepted/);
  assert.match(record, /- \[ \] A final operator go\/no-go decision is recorded/);
  assert.match(record, /- \[ \] Database backup posture remains open/);
});

test("external-gate register names accountable parties and closure evidence", () => {
  assert.match(externalGates, /main`: current default branch/);
  assert.doesNotMatch(externalGates, /main`: `(?:[0-9a-f]{40})`/);
  assert.match(externalGates, /263 total, 260 checked/);
  assert.match(externalGates, /020 — limited pilot scope/);
  assert.match(externalGates, /157 — database recovery posture/);
  assert.match(externalGates, /260 — final go\/no-go/);
  assert.match(externalGates, /Timestamped GO\/NO-GO decision/);
  assert.match(externalGates, /must not check any\s+row above merely because source tests are green/i);
});

test("readiness ledger points at the current reconciled mainline", () => {
  assert.match(readinessLedger, /Last updated: 2026-10-26 \(main `a8cfda3`;/);
  assert.match(readinessLedger, /Latest freshness evidence: sequence monitor workflow `40266407743`/);
  assert.match(readinessLedger, /Immutable deployed SHAs remain\s+in the release record/);
  assert.doesNotMatch(readinessLedger, /readiness-ledger reconciliation merged as PR #411 at/);
});

test("the queue and release record cannot silently drift from the open pilot set", () => {
  assert.deepEqual(openQueueIds(queue), ["020", "157", "260"]);
  assert.match(record, /not yet a go decision/i);
});
