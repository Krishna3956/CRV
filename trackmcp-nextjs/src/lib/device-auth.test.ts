import test from "node:test";
import assert from "node:assert/strict";
import { createDeviceAuthAdapter, isAllowedVerificationUrl, normalizeDeviceUserCode, fixtureDeviceAuthAdapter } from "./device-auth.ts";

test("device user codes are normalized only when they match the bounded format", () => {
  assert.equal(normalizeDeviceUserCode(" F7KQ-2M9D "), "F7KQ-2M9D");
  assert.equal(normalizeDeviceUserCode("f7kq-2m9d"), null);
  assert.equal(normalizeDeviceUserCode("F7KQ-2M0D"), null);
  assert.equal(normalizeDeviceUserCode("F7KQ-2M1D"), null);
  assert.equal(normalizeDeviceUserCode("raw-device-secret"), null);
  assert.equal(normalizeDeviceUserCode("F7KQ-2M9D-EXTRA"), null);
});

test("verification URLs require HTTPS except explicit local development mode", () => {
  assert.equal(isAllowedVerificationUrl("https://app.trackmcp.com/device"), true);
  assert.equal(isAllowedVerificationUrl("http://app.trackmcp.com/device"), false);
  assert.equal(isAllowedVerificationUrl("http://localhost:3000/device"), false);
  assert.equal(isAllowedVerificationUrl("http://localhost:3000/device", { allowLocalDevelopment: true }), true);
  assert.equal(isAllowedVerificationUrl("http://evil.test/device", { allowLocalDevelopment: true }), false);
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
    [400, { status: "invalid" }, { status: "invalid" }],
    [404, { status: "invalid" }, { status: "invalid" }],
    [410, { status: "expired" }, { status: "expired" }],
    [403, { status: "denied", reason_category: "user_denied" }, { status: "denied", reason_category: "user_denied" }],
    [409, { status: "denied", reason_category: "user_denied" }, { status: "denied", reason_category: "user_denied" }],
    [500, { error: "Could not approve device session." }, { status: "denied", reason_category: "unavailable" }],
  ] as const) {
    const adapter = createDeviceAuthAdapter(async () => response(status, body));
    assert.deepEqual(await adapter.approve({ userCode: "F7KQ-2M9D", workspaceId: "workspace-1" }), expected);
  }
});

test("real adapter preserves explicit terminal states and makes generic conflicts safe", async () => {
  for (const [body, expected] of [
    [{ status: "already_redeemed" }, { status: "already_redeemed" }],
    [{ status: "denied" }, { status: "denied", reason_category: "user_denied" }],
    [{ error: "Device session is no longer active." }, { status: "denied", reason_category: "unavailable" }],
  ] as const) {
    const adapter = createDeviceAuthAdapter(async () => response(409, body));
    assert.deepEqual(await adapter.approve({ userCode: "F7KQ-2M9D", workspaceId: "workspace-1" }), expected);
  }
});

test("real adapter maps the idempotent already-approved success response", async () => {
  const adapter = createDeviceAuthAdapter(async () => response(200, { status: "already_approved" }));
  assert.deepEqual(await adapter.approve({ userCode: "F7KQ-2M9D", workspaceId: "workspace-1" }), { status: "already_approved" });
});

test("unauthenticated approval is denied without creating a key", async () => {
  const adapter = createDeviceAuthAdapter(async () => response(401, { error: "Sign in required." }));
  assert.deepEqual(await adapter.approve({ userCode: "F7KQ-2M9D", workspaceId: "workspace-1" }), { status: "denied", reason_category: "user_denied" });
});

test("real adapter treats network/backend failures as unavailable", async () => {
  const adapter = createDeviceAuthAdapter(async () => { throw new Error("backend unavailable"); });
  assert.deepEqual(await adapter.approve({ userCode: "F7KQ-2M9D", workspaceId: "workspace-1" }), { status: "denied", reason_category: "unavailable" });
});
