import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../../", import.meta.url);
const queue = await readFile(new URL("FOUNDER-OS-100-CUSTOMER-PILOT-WORK-QUEUE.md", root), "utf8");
const record = await readFile(new URL("docs/FOUNDER-OS-100-CUSTOMER-PILOT-RELEASE-RECORD.md", root), "utf8");
const externalGates = await readFile(new URL("docs/FOUNDER-OS-100-CUSTOMER-PILOT-EXTERNAL-GATES.md", root), "utf8");
const acceptanceMatrix = await readFile(new URL("docs/FOUNDER-OS-100-CUSTOMER-PILOT-ACCEPTANCE-MATRIX.md", root), "utf8");
const pilotStatus = await readFile(new URL("FOUNDER-OS-100-CUSTOMER-PILOT-STATUS.md", root), "utf8");
const readinessLedger = await readFile(new URL("docs/FOUNDER-OS-100-CUSTOMER-READINESS-LEDGER.md", root), "utf8");

function section(source, heading, nextHeading) {
  const start = source.indexOf(heading);
  assert.notEqual(start, -1, `missing section: ${heading}`);
  const body = source.slice(start + heading.length);
  const end = nextHeading ? body.indexOf(nextHeading) : -1;
  return end === -1 ? body : body.slice(0, end);
}

function openQueueIds(source) {
  return [...source.matchAll(/^- \[ \] (\d+)\b/gm)].map((match) => match[1]);
}

test("pilot release record points at the verified deployed baseline", () => {
  const current = section(record, "## Current deployed baseline", "## Historical deployed baseline");
  assert.match(current, /177165180383e31bb7760040469f9aaa7f78f8a1/);
  assert.match(current, /41013186081/);
  assert.match(current, /dfcdb30f75f97df1c94f2adb1f0b67964c2376eb/);
  assert.match(current, /155 suites/);
  assert.match(current, /211 routes/);
  assert.match(current, /41038856612/);
});

test("pilot release record keeps accepted operational limitations explicit", () => {
  assert.match(record, /Status:\s*\*\*GO — controlled first-100 pilot\*/);
  assert.match(record, /Final release-owner GO/);
  assert.match(record, /FINAL GO — I approve TrackMCP for a controlled first-100-customer pilot/);
  assert.match(record, /supabase-backup-acceptance-2026-10-30/);
  assert.match(record, /Queue item 256 records the\s+release-specific rollback/);
  assert.match(record, /final operator go\/no-go decision/);
  assert.match(record, /40220255833/);
  assert.match(record, /iam:PassRole/);
});

test("release record preserves non-source acceptance decisions after owner acceptance", () => {
  assert.match(record, /metadata-only/);
  assert.match(record, /manual\/disabled-first/);
  assert.match(record, /PITR disabled/);
  assert.match(record, /krishnaatmu@gmail\.com/);
});

test("external-gate register names accountable parties and closure evidence", () => {
  assert.match(externalGates, /177165180383e31bb7760040469f9aaa7f78f8a1/);
  assert.match(externalGates, /41013186081/);
  assert.match(externalGates, /155 suites passed/);
  assert.match(externalGates, /Current source verification: `main` at/);
  assert.match(externalGates, /40397368253/);
  assert.match(externalGates, /40398170070/);
  assert.match(externalGates, /main`: current default branch/);
  assert.doesNotMatch(externalGates, /main`: `(?:[0-9a-f]{40})`/);
  assert.match(externalGates, /queued=0.*running=0.*retryable=0.*failed=0/s);
  assert.match(externalGates, /020 — limited pilot scope/);
  assert.match(externalGates, /157 — database recovery posture/);
  assert.match(externalGates, /260 — final go\/no-go/);
  assert.match(externalGates, /Timestamped GO\/NO-GO decision/);
  assert.match(externalGates, /must not check any\s+row above merely because source tests are green/i);
});

test("acceptance matrix separates current source from deployed runtime", () => {
  assert.match(acceptanceMatrix, /177165180383e31bb7760040469f9aaa7f78f8a1/);
  assert.match(acceptanceMatrix, /current\s+repository\s+source\s+is\s+`main`\s+at\s+(?:documentation reconciliation|merged application|documentation-only(?: handoff)?) (?:commit|tip)/);
  assert.match(acceptanceMatrix, /41014068784/);
  assert.match(acceptanceMatrix, /41038856612/);
  assert.match(acceptanceMatrix, /full local release gate passes 155\s+suites/);
  assert.match(acceptanceMatrix, /alert evaluator remains manual-only/);
});

test("root pilot status stays aligned with the current GO evidence baseline", () => {
  assert.match(pilotStatus, /Last verified: 2026-10-30/);
  assert.match(pilotStatus, /origin\/main` is `HEAD`/);
  assert.match(pilotStatus, /155 suites/);
  assert.match(pilotStatus, /211 routes/);
  assert.match(pilotStatus, /Release-owner scope approval and final first-100-user go\/no-go are recorded/);
});

test("readiness ledger points at the current reconciled mainline", () => {
  assert.match(readinessLedger, /Last updated: 2026-10-\d{2} \(main `(?:[0-9a-f]{7,40}|HEAD)`; deployed application `[0-9a-f]{7,40}` and/);
  assert.match(readinessLedger, /Latest freshness evidence: (?:refresh-worker|health) workflow `[0-9]+`/);
  assert.match(readinessLedger, /Immutable deployed SHAs remain\s+in the release record/);
  assert.doesNotMatch(readinessLedger, /readiness-ledger reconciliation merged as PR #411 at/);
});

test("the queue and release record cannot silently drift from the closed pilot set", () => {
  assert.deepEqual(openQueueIds(queue), []);
  assert.match(record, /Status:\s*\*\*GO — controlled first-100 pilot\*/i);
});
