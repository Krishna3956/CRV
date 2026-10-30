import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const register = await readFile(new URL("../../docs/FOUNDER-OS-100-CUSTOMER-PILOT-EXTERNAL-GATES.md", import.meta.url), "utf8");
const releaseRecord = await readFile(new URL("../../docs/FOUNDER-OS-100-CUSTOMER-PILOT-RELEASE-RECORD.md", import.meta.url), "utf8");
const schedulerHealthPolicy = await readFile(new URL("../../docs/aws/TrackMCPRefreshHealthLogReadPolicy.json", import.meta.url), "utf8");

test("first-100 external-gate register is explicit GO for the controlled pilot", () => {
  assert.match(register, /Status:\s*\*\*GO — controlled first-100 pilot\*\*/);
  assert.match(register, /Updated:\s*2026-10-30/);
  assert.match(register, /Final release-owner GO/);
  assert.match(register, /41049662323/);
  assert.match(register, /Current source verification: `main` at/);
  assert.match(register, /155 suites/);
  assert.match(register, /211-route/);
  assert.match(register, /workflow completion is not claimed|confirmed\s+the\s+exact runtime SHA/i);
});

test("all operator and infrastructure gates remain named with closure evidence", () => {
  for (const gate of ["020", "157", "260", "Privacy lifecycle acceptance", "Synthetic reliability-data hygiene", "Refresh scheduler enablement"]) {
    assert.ok(register.includes(gate), `missing gate: ${gate}`);
  }
  assert.match(register, /A gate is closed for this\s+pilot only when the named evidence is retained/i);
  assert.match(register, /Customer-facing claims remain limited to the controlled first-100/i);
});

test("the release record carries the same current source gate evidence", () => {
  assert.match(releaseRecord, /current source is\s+`main`\s+at (?:documentation reconciliation|the same merged application) commit|current source is\s+`main`\s+at documentation-only tip/i);
  assert.match(releaseRecord, /latest local release gate\s+passes\s+\*\*155\s+suites\*\*/i);
  assert.match(releaseRecord, /211 routes/);
  assert.match(releaseRecord, /transient App Runner\s+smoke retry boundary/);
  assert.match(releaseRecord, /177165180383e31bb7760040469f9aaa7f78f8a1/);
});

test("scheduler log evidence permission artifact is least-privilege and explicit", () => {
  const policy = JSON.parse(schedulerHealthPolicy);
  assert.deepEqual(policy.Statement, [{
    Sid: "ReadRefreshSchedulerLogEvidence",
    Effect: "Allow",
    Action: ["logs:DescribeLogStreams", "logs:FilterLogEvents"],
    Resource: "arn:aws:logs:ap-south-1:872575360367:log-group:/aws/lambda/trackmcp-refresh-schedule-*",
  }]);
  assert.equal(JSON.stringify(policy).includes("logs:PutLogEvents"), false);
  assert.equal(JSON.stringify(policy).includes("logs:Delete"), false);
});
