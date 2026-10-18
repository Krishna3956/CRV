import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const device = await readFile(new URL("./DeviceApprovalClient.tsx", import.meta.url), "utf8");
const deviceAuth = await readFile(new URL("../lib/device-auth.ts", import.meta.url), "utf8");
const dashboard = await readFile(new URL("./dashboard/DashboardApp.tsx", import.meta.url), "utf8");
const docs = await readFile(new URL("./DocsAnalytics.tsx", import.meta.url), "utf8");
const analytics = await readFile(new URL("../lib/marketing-analytics.ts", import.meta.url), "utf8");
const signin = await readFile(new URL("../app/signin/page.tsx", import.meta.url), "utf8");

test("device approval preserves auth handoff and CLI-only redemption", () => {
  assert.match(device, /user_code/);
  assert.match(device, /Sign in before approving/);
  assert.match(device, /if \(!data\.user\)/);
  assert.match(deviceAuth, /\/api\/v1\/cli\/device\/sessions\/approve/);
  assert.match(deviceAuth, /workspace_id/);
  assert.match(deviceAuth, /A-Z2-9/);
  assert.match(deviceAuth, /isAllowedVerificationUrl/);
  assert.match(device, /Approve CLI connection/);
  assert.match(device, /api\/v1\/account\/workspaces/);
  assert.match(device, /selectedWorkspaceId/);
  assert.match(device, /Select a workspace/);
  assert.match(device, /CLI redeems the one-time key/);
  assert.match(device, /cli_device_auth_approved/);
  assert.match(device, /already_redeemed/);
  assert.match(device, /unauthenticated/);
  assert.match(device, /Workspace service unavailable/);
  assert.match(device, /cli_device_auth_attempted/);
  assert.match(device, /cli_device_auth_already_approved/);
  assert.match(device, /cli_device_auth_already_redeemed/);
  assert.match(device, /cli_device_auth_unavailable/);
  assert.doesNotMatch(device, /api_key/);
  assert.doesNotMatch(device, /device_code/);
});

test("activation UI emits bounded copy and first-event events", () => {
  assert.match(dashboard, /api_key_copied/);
  assert.match(dashboard, /api_key_copy_failed/);
  assert.match(dashboard, /setup_snippet_copied/);
  assert.match(docs, /sdk_docs_viewed/);
});

test("server activation events are allowlisted, bounded, and fail-open", () => {
  for (const event of [
    "signup_completed",
    "workspace_created",
    "api_key_created",
    "api_key_copied",
    "setup_snippet_copied",
    "first_event_check_started",
    "first_event_check_result",
    "first_telemetry_seen",
  ]) assert.match(analytics, new RegExp(`\\"${event}\\"`));
  assert.match(analytics, /\/api\/v1\/activation\/events/);
  assert.match(analytics, /Analytics must remain fail-open/);
  assert.match(analytics, /safeContentPath/);
  assert.doesNotMatch(analytics, /workspace_id:|api_key:|email:|password:|device_code:|raw_url:/);
  assert.match(analytics, /SERVER_RESULT_CATEGORIES/);
  assert.match(analytics, /safePackageName/);
  assert.match(signin, /package_name: params\.get\("package"\)/);
});

test("dashboard preserves truthful activation states", () => {
  for (const phrase of [
    "Create your workspace",
    "Create a connection key",
    "Your MCP server has not sent its first event yet.",
    "Live data could not be loaded",
    "No live data available for this period.",
    "This is a guided example, not workspace telemetry",
  ]) assert.match(dashboard, new RegExp(phrase.replace(/[.*+?^${}()|[\\]\\]/g, "\\\\$&")));
  assert.match(dashboard, /dataMode === "example"/);
  assert.match(dashboard, /No other data source was substituted/);
});
