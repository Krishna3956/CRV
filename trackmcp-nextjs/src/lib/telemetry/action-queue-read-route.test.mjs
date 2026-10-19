import assert from "node:assert/strict";
import test from "node:test";
import { createActionQueueHandlers } from "../../app/api/v1/action-queue/handlers.ts";

function fakeAdmin(rows) {
  return {
    from(table) {
      if (table === "trackmcp_api_keys") return { select() { return this; }, eq() { return this; }, maybeSingle: async () => ({ data: { workspace_id: "workspace-1", revoked_at: null }, error: null }) };
      if (table === "trackmcp_workspace_members") return { select() { return this; }, eq() { return this; }, limit() { return this; }, maybeSingle: async () => ({ data: { workspace_id: "workspace-1", role: "member" }, error: null }) };
      assert.equal(table, "trackmcp_action_queue");
      const query = {
        select() { return this; },
        eq() { return this; },
        lt() { return this; },
        order() { return this; },
        limit() { return this; },
        in() { return this; },
        then(resolve) { return Promise.resolve({ data: rows, error: null }).then(resolve); },
      };
      return query;
    },
  };
}

test("action queue GET rejects ingest API keys", async () => {
  const handler = createActionQueueHandlers(() => fakeAdmin([]), async () => ({ auth: { getUser: async () => ({ data: { user: null } }) } }));
  const response = await handler.GET(new Request("http://test/api/v1/action-queue", { headers: { authorization: "Bearer tmcp_test" } }));
  assert.equal(response.status, 403);
});

test("action queue GET returns bounded workspace-scoped rows for a signed-in member", async () => {
  const handler = createActionQueueHandlers(() => fakeAdmin([{ id: "item-1", workspace_id: "workspace-1", status: "open", evidence: { calls: 5 }, revision: 1 }]), async () => ({ auth: { getUser: async () => ({ data: { user: { id: "user-1" } } }) } }));
  const response = await handler.GET(new Request("http://test/api/v1/action-queue?status=open&limit=10&workspace_id=workspace-1"));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.cursor_parameter, "before");
  assert.equal(body.next_cursor, null);
  assert.deepEqual(body.data[0], {
    id: "item-1", workspace_id: "workspace-1", status: "open", evidence: { calls: 5 },
    acknowledged_at: null, snoozed_until: null,
    resolved_at: null, resolution_note: null, revision: 1,
  });
});

test("action queue GET rejects unknown status filters", async () => {
  const handler = createActionQueueHandlers(() => fakeAdmin([]), async () => ({ auth: { getUser: async () => ({ data: { user: { id: "user-1" } } }) } }));
  const response = await handler.GET(new Request("http://test/api/v1/action-queue?status=bogus"));
  assert.equal(response.status, 400);
});

test("optional alert links are workspace-scoped and absent when the link schema is unavailable", async () => {
  const handler = createActionQueueHandlers(() => fakeAdmin([{ id: "item-1", workspace_id: "workspace-1", fingerprint: "f1", status: "open", revision: 1 }]), async () => ({ auth: { getUser: async () => ({ data: { user: { id: "user-1" } } }) } }));
  const response = await handler.GET(new Request("http://test/api/v1/action-queue?include_alerts=true&workspace_id=workspace-1"));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body.data[0].linked_alerts, []);
});
