import assert from "node:assert/strict";
import test from "node:test";
import { createApproveHandler } from "./handlers.ts";
import { hashDeviceCode } from "../../../../../../../lib/cli/device-auth.ts";

const USER_CODE = "ABCD-2345";
const WORKSPACE_A = "11111111-1111-4111-8111-111111111111";
const WORKSPACE_B = "22222222-2222-4222-8222-222222222222";

function request(workspaceId) {
  return new Request("https://example.test/api/v1/cli/device/sessions/approve", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ user_code: USER_CODE, workspace_id: workspaceId }),
  });
}

function fakeAdmin({ memberWorkspace = WORKSPACE_A, sessionStatus = "pending", expiresAt = new Date(Date.now() + 60_000).toISOString() } = {}) {
  const updates = [];
  const lookups = [];
  return {
    updates,
    lookups,
    from(table) {
      const query = {
        select() { return this; },
        eq(field, value) {
          this.filters ??= {};
          this.filters[field] = value;
          if (table === "trackmcp_cli_device_sessions" && this.pendingUpdate && field === "id") {
            updates.push({ table, values: this.pendingUpdate, filters: this.filters });
          }
          return this;
        },
        async maybeSingle() {
          if (table === "trackmcp_workspace_members") return { data: this.filters.workspace_id === memberWorkspace ? { workspace_id: memberWorkspace } : null, error: null };
          lookups.push({ table, filters: this.filters });
          return { data: { id: "session-1", status: sessionStatus, expires_at: expiresAt }, error: null };
        },
        update(values) {
          this.pendingUpdate = values;
          return this;
        },
        in() { return Promise.resolve({ error: null }); },
      };
      return query;
    },
  };
}

test("approval rejects a workspace the signed-in user cannot access", async () => {
  const admin = fakeAdmin({ memberWorkspace: WORKSPACE_A });
  const handler = createApproveHandler(async () => ({ id: "user-1" }), () => admin);
  const response = await handler(request(WORKSPACE_B));
  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { error: "Workspace access denied." });
  assert.equal(admin.updates.length, 0, "unauthorized approval must not mutate the device session");
});

test("approval binds the pending session to the authorized workspace and user", async () => {
  const admin = fakeAdmin({ memberWorkspace: WORKSPACE_A });
  const handler = createApproveHandler(async () => ({ id: "user-1" }), () => admin);
  const response = await handler(request(WORKSPACE_A));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "approved" });
  assert.deepEqual(admin.updates[0].values, { status: "approved", approved_user_id: "user-1", approved_workspace_id: WORKSPACE_A });
  assert.equal(admin.updates[0].filters.id, "session-1");
});

test("approval only hashes the bounded device code before session lookup", async () => {
  const admin = fakeAdmin();
  const handler = createApproveHandler(async () => ({ id: "user-1" }), () => admin);
  const response = await handler(request(WORKSPACE_A));
  assert.equal(response.status, 200);
  // The fake query stores the exact hash predicate, not the user-facing code.
  const sessionQuery = admin.lookups.find((lookup) => lookup.table === "trackmcp_cli_device_sessions");
  assert.equal(sessionQuery.filters.user_code_hash, hashDeviceCode(USER_CODE));
  assert.notEqual(sessionQuery.filters.user_code_hash, USER_CODE);
});

test("approval preserves terminal lifecycle states without minting a key", async () => {
  for (const [sessionStatus, expectedStatus, expectedHttp] of [
    ["approved", "already_approved", 200],
    ["redeemed", "already_redeemed", 409],
    ["denied", "denied", 403],
  ]) {
    const admin = fakeAdmin({ sessionStatus });
    const handler = createApproveHandler(async () => ({ id: "user-1" }), () => admin);
    const response = await handler(request(WORKSPACE_A));
    assert.equal(response.status, expectedHttp, sessionStatus);
    const body = await response.json();
    assert.equal(body.status, expectedStatus, sessionStatus);
    assert.equal(admin.updates.length, 0, `${sessionStatus} must not be mutated`);
    assert.equal("api_key" in body, false);
  }
});

test("approval expires an expired pending session and returns no secret material", async () => {
  const admin = fakeAdmin({ expiresAt: new Date(Date.now() - 60_000).toISOString() });
  const handler = createApproveHandler(async () => ({ id: "user-1" }), () => admin);
  const response = await handler(request(WORKSPACE_A));
  assert.equal(response.status, 410);
  assert.deepEqual(await response.json(), { status: "expired" });
  assert.deepEqual(admin.updates[0].values, { status: "expired" });
});

