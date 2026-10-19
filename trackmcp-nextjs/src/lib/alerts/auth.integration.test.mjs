import assert from "node:assert/strict";
import test from "node:test";
import { authenticateAlertRequest } from "./auth.ts";

function adminFor(memberships, keyWorkspace = "workspace-key") {
  return {
    from(table) {
      let filters = {};
      const query = {
        select() { return query; },
        eq(column, value) { filters[column] = value; return query; },
        limit() { return query; },
        async maybeSingle() {
          if (table === "trackmcp_api_keys") return { data: filters.key_hash ? { workspace_id: keyWorkspace, revoked_at: null } : null, error: null };
          const match = memberships.find((item) => item.user_id === filters.user_id && (!filters.workspace_id || item.workspace_id === filters.workspace_id));
          return { data: match || null, error: null };
        },
      };
      return query;
    },
  };
}

function serverFor(userId = "user-1") {
  return async () => ({ auth: { getUser: async () => ({ data: { user: { id: userId } } }) } });
}

test("browser sessions select the requested member workspace and preserve role", async () => {
  const memberships = [
    { user_id: "user-1", workspace_id: "workspace-a", role: "member" },
    { user_id: "user-1", workspace_id: "workspace-b", role: "owner" },
  ];
  const result = await authenticateAlertRequest(
    new Request("https://app.test/api/v1/alert-incidents?workspace_id=workspace-b"),
    () => adminFor(memberships),
    serverFor(),
  );
  assert.equal("response" in result, false);
  if ("response" in result) return;
  assert.equal(result.workspaceId, "workspace-b");
  assert.equal(result.canManageActionQueue, true);
  assert.equal(result.actorId, "user-1");
});

test("browser sessions cannot select a workspace without membership", async () => {
  const result = await authenticateAlertRequest(
    new Request("https://app.test/api/v1/alert-incidents?workspace_id=workspace-foreign"),
    () => adminFor([{ user_id: "user-1", workspace_id: "workspace-a", role: "owner" }]),
    serverFor(),
  );
  assert.equal("response" in result, true);
  if (!('response' in result)) return;
  assert.equal(result.response.status, 404);
  assert.match(await result.response.text(), /do not have access/);
});

test("API-key requests stay bound to the key workspace despite a query parameter", async () => {
  const result = await authenticateAlertRequest(
    new Request("https://app.test/api/v1/alert-incidents?workspace_id=workspace-foreign", { headers: { authorization: "Bearer tmcp_test-key" } }),
    () => adminFor([]),
    serverFor(),
  );
  assert.equal("response" in result, false);
  if ("response" in result) return;
  assert.equal(result.workspaceId, "workspace-key");
  assert.equal(result.canManageActionQueue, false);
  assert.equal(result.actorId, null);
});
