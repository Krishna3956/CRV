import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const register = await readFile(new URL("../../docs/FOUNDER-OS-100-CUSTOMER-PILOT-EXTERNAL-GATES.md", import.meta.url), "utf8");
const releaseRecord = await readFile(new URL("../../docs/FOUNDER-OS-100-CUSTOMER-PILOT-RELEASE-RECORD.md", import.meta.url), "utf8");
const schedulerHealthPolicy = await readFile(new URL("../../docs/aws/TrackMCPRefreshHealthLogReadPolicy.json", import.meta.url), "utf8");

test("first-100 external-gate register stays an explicit HOLD record", () => {
  assert.match(register, /Status:\s*\*\*HOLD\*\*/);
  assert.match(register, /Updated:\s*2026-10-29/);
  assert.match(register, /main.*HEAD/s);
  assert.match(register, /152 suites/);
  assert.match(register, /209-route/);
  assert.match(register, /does not change the deployed image|records the already-successful/i);
});

test("all operator and infrastructure gates remain named and open until evidence closes them", () => {
  for (const gate of ["020", "157", "260", "Privacy lifecycle acceptance", "Synthetic reliability-data hygiene", "Refresh scheduler enablement"]) {
    assert.ok(register.includes(gate), `missing gate: ${gate}`);
  }
  assert.match(register, /A gate becomes closed only\s+when the named evidence is retained/i);
});

test("the release record carries the same current source gate evidence", () => {
  assert.match(releaseRecord, /current repository source is `main` at `HEAD`/i);
  assert.match(releaseRecord, /latest local release gate\s+passes\s+\*\*152\s+suites\*\*/i);
  assert.match(releaseRecord, /209 routes/);
  assert.match(releaseRecord, /transient App Runner\s+smoke retry boundary/);
  assert.match(releaseRecord, /deployed application is\s+immutable source `e0629ea1`/);
  assert.match(releaseRecord, /current repository source is `main` at `HEAD`/i);
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
