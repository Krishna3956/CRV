import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const policy = read("../docs/FOUNDER-OS-RATE-LIMITING.md");
const start = read("src/app/api/v1/cli/device/sessions/handlers.ts");
const poll = read("src/app/api/v1/cli/device/sessions/poll/route.ts");
const keyStatus = read("src/app/api/v1/cli/key-status/route.ts");
const redeem = read("src/app/api/v1/cli/device/sessions/redeem/handlers.ts");

test("rate-limit policy documents current route thresholds and ownership boundary", () => {
  for (const phrase of ["Device session start", "Device session poll", "Device session redeem", "Key status", "owner review required", "false-positive"]) {
    assert.ok(policy.toLowerCase().includes(phrase.toLowerCase()), `missing rate-limit policy phrase: ${phrase}`);
  }
});

test("implemented route thresholds remain aligned with the policy", () => {
  assert.match(start, /limit:\s*10,\s*windowMs:\s*60_000/);
  assert.match(poll, /limit:\s*120,\s*windowMs:\s*10\s*\*\s*60_000/);
  assert.match(keyStatus, /limit:\s*30,\s*windowMs:\s*60_000/);
  assert.match(redeem, /readBoundedJsonObject/);
  assert.match(policy, /Device session redeem[\s\S]*5 \/ 60 seconds/);
});

test("rate-limit policy keeps secret and proxy boundaries explicit", () => {
  assert.match(policy, /Authorization-header hash/);
  assert.match(policy, /never issue a second key/);
  assert.match(policy, /without requesting or logging the secret/);
  assert.doesNotMatch(policy, /log the raw (key|device code)/i);
});
