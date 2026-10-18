import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const device = await readFile(new URL("./DeviceApprovalClient.tsx", import.meta.url), "utf8");
const deviceAuth = await readFile(new URL("../lib/device-auth.ts", import.meta.url), "utf8");
const dashboard = await readFile(new URL("./dashboard/DashboardApp.tsx", import.meta.url), "utf8");
const docs = await readFile(new URL("./DocsAnalytics.tsx", import.meta.url), "utf8");

test("device approval preserves auth handoff and CLI-only redemption", () => {
  assert.match(device, /user_code/);
  assert.match(device, /Sign in before approving/);
  assert.match(device, /if \(!data\.user\)/);
  assert.match(deviceAuth, /\/api\/v1\/cli\/device\/sessions\/approve/);
  assert.match(deviceAuth, /workspace_id/);
  assert.match(deviceAuth, /A-Z2-9/);
  assert.match(deviceAuth, /isAllowedVerificationUrl/);
  assert.match(device, /Approve CLI connection/);
  assert.match(device, /CLI redeems the one-time key/);
  assert.match(device, /cli_device_auth_approved/);
  assert.match(device, /already_redeemed/);
  assert.doesNotMatch(device, /api_key/);
  assert.doesNotMatch(device, /device_code/);
});

test("activation UI emits bounded copy and first-event events", () => {
  assert.match(dashboard, /api_key_copied/);
  assert.match(dashboard, /api_key_copy_failed/);
  assert.match(dashboard, /setup_snippet_copied/);
  assert.match(docs, /sdk_docs_viewed/);
});
