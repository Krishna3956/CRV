import assert from "node:assert/strict";
import test from "node:test";
import { createAnalyticsHandler } from "../../v1/analytics/handlers.ts";
import { createCatalogsHandler } from "./handlers.ts";

const workspace = "workspace-catalog-a";
const snapshot = {
  id: "snapshot-2",
  workspace_id: workspace,
  server_id: "11111111-1111-4111-8111-111111111111",
  environment_id: null,
  catalog_kind: "tools",
  item_count: 2,
  item_name_hashes: ["a".repeat(64), "b".repeat(64)],
  item_uri_hashes: [],
  snapshot_hash: "c".repeat(64),
  previous_snapshot_id: "snapshot-1",
  complete: true,
  truncated: false,
  diff: { status: "computed", added_name_count: 1, removed_name_count: 0 },
  discovered_at: "2026-01-02T00:00:00Z",
  payload: { should_never_leave_storage: true },
};

function fakeAdmin() {
  return {
    from(table) {
      if (table === "trackmcp_api_keys") return { select() { return this; }, eq() { return this; }, maybeSingle: async () => ({ data: { workspace_id: workspace, revoked_at: null }, error: null }) };
      const query = {
        select() { return this; },
        eq() { return this; },
        gte() { return this; },
        order() { return this; },
        limit: async () => ({ data: table === "trackmcp_catalog_versions" ? [snapshot] : [], error: null }),
      };
      return query;
    },
  };
}

test("catalog API exposes bounded historical metadata without raw payloads", async () => {
  const admin = fakeAdmin();
  const analytics = createAnalyticsHandler(() => admin, async () => ({ auth: { getUser: async () => ({ data: { user: null } }) } }));
  const handler = createCatalogsHandler(analytics);
  const response = await handler(new Request("http://catalogs.test/api/v2/catalogs?days=30", { headers: { authorization: "Bearer key" } }));
  assert.equal(response.status, 200);
  const body = await response.json();
  const referenceVersion = snapshot.snapshot_hash;
  const referenceAdded = snapshot.diff.added_name_count;
  assert.equal(body.versioning.historical_versions, true);
  assert.equal(body.catalogs[1].version, referenceVersion);
  assert.equal(body.catalogs[1].diff.added_name_count, referenceAdded);
  assert.equal(JSON.stringify(body).includes("should_never_leave_storage"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(body.catalogs[1], "payload"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(body.catalogs[1], "workspace_id"), false);
});
