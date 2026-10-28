import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./production-device-flow-smoke.mjs", import.meta.url), "utf8");

test("device-flow smoke is HTTPS-only, explicitly write-gated, and bounded", () => {
  assert.match(source, /I_UNDERSTAND_DEVICE_FLOW_SMOKE/);
  assert.match(source, /TRACKMCP_DEVICE_FLOW_ALLOW_WRITE/);
  assert.match(source, /parsed\.protocol !== "https:"/);
  assert.match(source, /trustedHost/);
  assert.match(source, /AbortSignal\.timeout\(15_000\)/);
  assert.match(source, /cookie\.length > 16_384/);
});

test("device-flow smoke covers activation, first event, and revocation without logging secrets", () => {
  for (const marker of [
    "/api/v1/cli/device/sessions",
    "/api/v1/cli/device/sessions/approve",
    "/api/v1/cli/device/sessions/poll",
    "/api/v1/cli/device/sessions/redeem",
    "/api/v1/ingest",
    "/api/v1/cli/key-status",
    "/api/v1/account/keys/",
    "accepted_telemetry",
  ]) assert.match(source, new RegExp(marker.replace(/[.*+?^${}()|[\\]\\]/g, "\\\\$&")), marker);
  assert.match(source, /No cookie, device code, key, event ID, workspace ID, response body/);
  assert.doesNotMatch(source, /console\.log\([^)]*(cookie|deviceCode|replacementKey|workspaceId)/);
});

test("device-flow smoke exercises both bounded OTLP/HTTP formats", () => {
  assert.match(source, /\/api\/v1\/otel\/v1\/traces/);
  assert.match(source, /sendOtelFormat\(replacementKey, "json"\)/);
  assert.match(source, /sendOtelFormat\(replacementKey, "protobuf"\)/);
  assert.match(source, /application\/x-protobuf/);
  assert.match(source, /otlp-http-\$\{format\}/);
  assert.match(source, /No cookie, device code, key, event ID, workspace ID, response body/);
});

test("device-flow smoke uses a release-neutral user-agent and uniquely named disposable key", () => {
  assert.match(source, /user-agent": "TrackMCP device-flow-smoke/);
  assert.match(source, /device-flow-smoke-\$\{randomBytes/);
  assert.doesNotMatch(source, /user-agent": "TrackMCP\/0\.1\./);
});

test("device-flow smoke keeps cleanup scoped to this run", () => {
  assert.match(source, /key\?\.name === keyName/);
  assert.match(source, /Never guess at or mutate another workspace key/);
});

test("device-flow workflow is manual, secret-gated, and explicitly write-confirmed", async () => {
  const workflow = await readFile(new URL("../../.github/workflows/production-device-flow-smoke.yml", import.meta.url), "utf8");
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /confirm_write:/);
  assert.match(workflow, /type: boolean/);
  assert.match(workflow, /inputs\.confirm_write && 'I_UNDERSTAND_DEVICE_FLOW_SMOKE'/);
  assert.match(workflow, /inputs\.confirm_write && 'true'/);
  assert.match(workflow, /TRACKMCP_DEVICE_FLOW_COOKIE/);
  assert.match(workflow, /TRACKMCP_DEVICE_FLOW_WORKSPACE_ID/);
  assert.match(workflow, /Upload redacted device-flow evidence/);
});
