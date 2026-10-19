import assert from "node:assert/strict";
import test from "node:test";
import { createActionQueueItemHandlers } from "../../app/api/v1/action-queue/[id]/handlers.ts";

function fakeAdmin(item) {
  return {
    from(table) {
      if (table === "trackmcp_api_keys") return { select() { return this; }, eq() { return this; }, maybeSingle: async () => ({ data: { workspace_id: "workspace-1", revoked_at: null }, error: null }) };
      if (table === "trackmcp_workspace_members") return { select() { return this; }, eq() { return this; }, limit() { return this; }, maybeSingle: async () => ({ data: { workspace_id: "workspace-1", role: "owner" }, error: null }) };
      assert.equal(table, "trackmcp_action_queue");
      const state = { ...item };
      return {
        select() { return this; },
        eq() { return this; },
        maybeSingle: async () => ({ data: state, error: null }),
        update(values) { Object.assign(state, values); return this; },
      };
    },
  };
}

const server = async () => ({ auth: { getUser: async () => ({ data: { user: null } }) } });

test("action queue PATCH rejects ingest API keys for human lifecycle changes", async () => {
  const item = { id: "item-1", workspace_id: "workspace-1", status: "open", revision: 1 };
  const handler = createActionQueueItemHandlers(() => fakeAdmin(item), server);
  const response = await handler.PATCH(new Request("http://test/api/v1/action-queue/item-1", { method: "PATCH", headers: { authorization: "Bearer tmcp_test" }, body: JSON.stringify({ action: "acknowledge" }) }), { params: Promise.resolve({ id: "item-1" }) });
  assert.equal(response.status, 403);
});

test("action queue PATCH allows an owner browser session", async () => {
  const item = { id: "item-1", workspace_id: "workspace-1", status: "open", revision: 1 };
  const handler = createActionQueueItemHandlers(() => fakeAdmin(item), async () => ({ auth: { getUser: async () => ({ data: { user: { id: "user-1" } } }) } }));
  const response = await handler.PATCH(new Request("http://test/api/v1/action-queue/item-1?workspace_id=workspace-1", { method: "PATCH", body: JSON.stringify({ action: "acknowledge" }) }), { params: Promise.resolve({ id: "item-1" }) });
  assert.equal(response.status, 200);
});

test("action queue PATCH rejects invalid mutations", async () => {
  const item = { id: "item-1", workspace_id: "workspace-1", status: "open", revision: 1 };
  const handler = createActionQueueItemHandlers(() => fakeAdmin(item), server);
  const response = await handler.PATCH(new Request("http://test/api/v1/action-queue/item-1", { method: "PATCH", headers: { authorization: "Bearer tmcp_test" }, body: JSON.stringify({ action: "delete" }) }), { params: Promise.resolve({ id: "item-1" }) });
  assert.equal(response.status, 400);
});
