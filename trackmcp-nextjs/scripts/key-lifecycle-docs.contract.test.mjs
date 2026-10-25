import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [docs, packageJson] = await Promise.all([
  readFile(new URL("../../docs/FOUNDER-OS-PRODUCTION-PILOT-SMOKE.md", import.meta.url), "utf8"),
  readFile(new URL("../package.json", import.meta.url), "utf8"),
]);

test("production key lifecycle runbook points to the explicit write-gated command", () => {
  assert.match(docs, /TRACKMCP_KEY_LIFECYCLE_CONFIRM=I_UNDERSTAND_KEY_LIFECYCLE_SMOKE/);
  assert.match(docs, /TRACKMCP_LIFECYCLE_ALLOW_WRITE=true/);
  assert.match(docs, /npm run smoke:production-key-lifecycle/);
  assert.match(docs, /never prints or/);
  assert.match(docs, /stores the cookie, key, workspace ID, key ID, or response body/i);
});

test("package scripts expose the lifecycle command without making it part of release smoke", () => {
  const parsed = JSON.parse(packageJson);
  assert.equal(parsed.scripts["smoke:production-key-lifecycle"], "node scripts/production-key-lifecycle-smoke.mjs");
  assert.equal(parsed.scripts["test:production-key-lifecycle-smoke"], "node --test scripts/production-key-lifecycle-smoke.test.mjs");
});
