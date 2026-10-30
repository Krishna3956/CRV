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
  transport: "streamable_http",
  catalog_kind: "tools",
  item_count: 2,
  item_name_hashes: ["a".repeat(64), "b".repeat(64)],
  item_uri_hashes: [],
  snapshot_hash: "c".repeat(64),
  previous_snapshot_id: "snapshot-1",
  previous_snapshot_status: "available",
  previous_snapshot: { id: "snapshot-1", version: "e".repeat(64), observed_at: "2026-01-01T00:00:00Z", transport: "streamable_http", catalog_kind: "tools", item_count: 1, item_name_hashes: ["f".repeat(64)], item_uri_hashes: [], complete: true, truncated: false, diff: { status: "unchanged" }, private_payload: "should-never-leave-storage" },
  complete: true,
  truncated: false,
  diff: { status: "computed", changed: true, added_name_count: 1, removed_name_count: 0, added_name_hashes: ["d".repeat(64), "raw-tool-name"], private_diff: "should-never-leave-storage" },
  discovered_at: "2026-01-02T00:00:00Z",
  payload: { should_never_leave_storage: true },
};

function fakeAdmin() {
  return {
    from(table) {
      if (table === "trackmcp_api_keys") return { select() { return this; }, eq() { return this; }, maybeSingle: async () => ({ data: { workspace_id: workspace, revoked_at: null }, error: null }) };
      const query = {
        ids: [],
        select() { return this; },
        eq() { return this; },
        in(_column, values) { this.ids = values; return this; },
        gte() { return this; },
        order() { return this; },
        async limit() { return { data: table === "trackmcp_catalog_versions" ? (this.ids.includes("snapshot-1") ? [{ id: "snapshot-1", snapshot_hash: "e".repeat(64), transport: "streamable_http", catalog_kind: "tools", item_count: 1, item_name_hashes: ["f".repeat(64)], item_uri_hashes: [], complete: true, truncated: false, diff: { status: "unchanged" }, discovered_at: "2026-01-01T00:00:00Z" }] : [snapshot]) : [], error: null }; },
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
  assert.equal(body.versioning.notification_correlations.length, 4);
  assert.equal(body.versioning.notification_correlations[0].kind, "tools");
  assert.equal(body.versioning.notification_correlations[0].snapshots, 1);
  assert.equal(body.versioning.notification_correlations[0].match_window_ms, 600000);
  assert.match(body.caveats.join(" "), /Historical rows contain bounded hashes/);
  assert.equal(body.catalogs[1].version, referenceVersion);
  assert.equal(body.catalogs[1].transport, "streamable_http");
  assert.equal(body.catalogs[1].diff.added_name_count, referenceAdded);
  assert.deepEqual(body.catalogs[1].diff.added_name_hashes, ["d".repeat(64)]);
  assert.equal(body.catalogs[1].previous_snapshot_status, "available");
  assert.equal(body.catalogs[1].previous_snapshot.id, "snapshot-1");
  assert.equal(body.catalogs[1].previous_snapshot.version, "e".repeat(64));
  assert.equal(body.catalogs[1].previous_snapshot.transport, "streamable_http");
  assert.deepEqual(body.catalogs[1].previous_snapshot.item_name_hashes, ["f".repeat(64)]);
  assert.equal(JSON.stringify(body).includes("should-never-leave-storage"), false);
  assert.equal(JSON.stringify(body).includes("raw-tool-name"), false);
  assert.equal(JSON.stringify(body).includes("should_never_leave_storage"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(body.catalogs[1], "payload"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(body.catalogs[1], "workspace_id"), false);
});
