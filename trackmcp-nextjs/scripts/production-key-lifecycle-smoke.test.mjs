import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./production-key-lifecycle-smoke.mjs", import.meta.url), "utf8");

test("key lifecycle smoke is HTTPS-only, explicitly write-gated, and bounded", () => {
  assert.match(source, /I_UNDERSTAND_KEY_LIFECYCLE_SMOKE/);
  assert.match(source, /TRACKMCP_LIFECYCLE_ALLOW_WRITE/);
  assert.match(source, /parsed\.protocol !== "https:"/);
  assert.match(source, /trustedHost/);
  assert.match(source, /AbortSignal\.timeout\(15_000\)/);
});

test("key lifecycle smoke verifies rotation and revocation without logging secrets", () => {
  for (const marker of ["rotate active key", "old key rejected after rotation", "replacement key accepted", "revoke replacement key", "replacement key rejected after revoke", "/api/v1/account/keys/", "/api/v1/cli/key-status"]) assert.match(source, new RegExp(marker.replace(/[.*+?^${}()|[\\]\\]/g, "\\\\$&")), marker);
  assert.match(source, /No cookie, key, workspace ID, response body, or credential/);
  assert.doesNotMatch(source, /console\.log\([^)]*(cookie|oldKey|replacementKey|workspaceId)/);
});

test("key lifecycle smoke user-agent is release-neutral", () => {
  assert.match(source, /user-agent": "TrackMCP lifecycle-smoke/);
  assert.doesNotMatch(source, /user-agent": "TrackMCP\/0\.1\./);
});

test("key lifecycle workflow requires explicit write confirmation", async () => {
  const workflow = await readFile(new URL("../../.github/workflows/production-key-lifecycle-smoke.yml", import.meta.url), "utf8");
  assert.match(workflow, /confirm_write:/);
  assert.match(workflow, /type: boolean/);
  assert.match(workflow, /inputs\.confirm_write && 'I_UNDERSTAND_KEY_LIFECYCLE_SMOKE'/);
  assert.match(workflow, /inputs\.confirm_write && 'true'/);
});
