import test from "node:test";
import assert from "node:assert/strict";
import { createDeviceAuthAdapter, normalizeDeviceUserCode, fixtureDeviceAuthAdapter } from "./device-auth.ts";

test("device user codes are normalized only when they match the bounded format", () => {
  assert.equal(normalizeDeviceUserCode(" f7kq-2m9d "), "F7KQ-2M9D");
  assert.equal(normalizeDeviceUserCode("raw-device-secret"), null);
  assert.equal(normalizeDeviceUserCode("F7KQ-2M9D-EXTRA"), null);
});

test("device fixture adapter returns the explicit approved result", async () => {
  const adapter = fixtureDeviceAuthAdapter({
    status: "approved",
  });
  assert.deepEqual(
    await adapter.approve({ userCode: "F7KQ-2M9D", workspaceId: "workspace-1" }),
    { status: "approved" },
  );
});

function response(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

test("real adapter posts only bounded approval fields and handles approval", async () => {
  let request: RequestInit | undefined;
  const adapter = createDeviceAuthAdapter(async (_url, init) => { request = init; return response(200, { status: "approved" }); });
  assert.deepEqual(await adapter.approve({ userCode: "F7KQ-2M9D", workspaceId: "workspace-1" }), { status: "approved" });
  assert.equal(request?.method, "POST");
  assert.deepEqual(JSON.parse(String(request?.body)), { user_code: "F7KQ-2M9D", workspace_id: "workspace-1" });
  assert.doesNotMatch(String(request?.body), /api_key|password|email|device_code/);
});

test("real adapter maps invalid, expired, denied, and unavailable responses", async () => {
  for (const [status, body, expected] of [
    [400, { error: "Invalid device approval request." }, { status: "invalid" }],
    [410, { status: "expired" }, { status: "expired" }],
    [403, { error: "Workspace access denied." }, { status: "denied", reason_category: "user_denied" }],
    [503, { error: "Device authorization is not configured." }, { status: "denied", reason_category: "unavailable" }],
  ] as const) {
    const adapter = createDeviceAuthAdapter(async () => response(status, body));
    assert.deepEqual(await adapter.approve({ userCode: "F7KQ-2M9D", workspaceId: "workspace-1" }), expected);
  }
});

test("real adapter treats network/backend failures as unavailable", async () => {
  const adapter = createDeviceAuthAdapter(async () => { throw new Error("backend unavailable"); });
  assert.deepEqual(await adapter.approve({ userCode: "F7KQ-2M9D", workspaceId: "workspace-1" }), { status: "denied", reason_category: "unavailable" });
});
