import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../../", import.meta.url);
const queue = await readFile(new URL("FOUNDER-OS-100-CUSTOMER-PILOT-WORK-QUEUE.md", root), "utf8");
const record = await readFile(new URL("docs/FOUNDER-OS-100-CUSTOMER-PILOT-RELEASE-RECORD.md", root), "utf8");

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
  assert.match(record, /current-SHA rerun remains required/);
  assert.match(record, /final operator go\/no-go decision/);
  assert.match(record, /distributed multi-instance limiting is\s+explicitly outside the claimed scope/i);
});

test("the queue and release record cannot silently drift from the open pilot set", () => {
  assert.deepEqual(openQueueIds(queue), ["020", "047", "048", "052", "053", "157", "260"]);
  assert.match(record, /not yet a go decision/i);
});
