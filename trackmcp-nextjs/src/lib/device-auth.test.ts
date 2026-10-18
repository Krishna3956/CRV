import test from "node:test";
import assert from "node:assert/strict";
import { normalizeDeviceUserCode, fixtureDeviceAuthAdapter } from "./device-auth.ts";

test("device user codes are normalized only when they match the bounded format", () => {
  assert.equal(normalizeDeviceUserCode(" f7kq-2m9d "), "F7KQ-2M9D");
  assert.equal(normalizeDeviceUserCode("raw-device-secret"), null);
  assert.equal(normalizeDeviceUserCode("F7KQ-2M9D-EXTRA"), null);
});

test("device fixture adapter returns the explicit approved result", async () => {
  const adapter = fixtureDeviceAuthAdapter({
    status: "approved",
    workspace: { id: "workspace-1", name: "Demo", slug: "demo" },
  });
  assert.deepEqual(
    await adapter.approve({ userCode: "F7KQ-2M9D", workspaceId: "workspace-1", createInitialKey: true }),
    { status: "approved", workspace: { id: "workspace-1", name: "Demo", slug: "demo" } },
  );
});
