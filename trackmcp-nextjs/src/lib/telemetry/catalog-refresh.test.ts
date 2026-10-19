import assert from "node:assert/strict";
import test from "node:test";
import { buildCatalogVersionWrites } from "./catalog-refresh.ts";

const server = "11111111-1111-4111-8111-111111111111";
const environment = "22222222-2222-4222-8222-222222222222";
const hash = "a".repeat(64);

test("builds one bounded version row from the newest observation", () => {
  const writes = buildCatalogVersionWrites("workspace-1", [
    { server_id: server, environment_id: environment, catalog_kind: "tools", catalog_item_count: 2, catalog_item_name_hashes: [hash, "b".repeat(64)], started_at: "2026-01-02T00:00:00Z" },
    { server_id: server, environment_id: environment, catalog_kind: "tools", catalog_item_count: 1, catalog_item_name_hashes: [hash], started_at: "2026-01-01T00:00:00Z" },
  ]);
  assert.equal(writes.length, 1);
  assert.equal(writes[0].item_count, 2);
  assert.equal(writes[0].observation_source, "worker");
  assert.equal(writes[0].previous_snapshot_id, null);
  assert.equal(writes[0].diff.status, "not_comparable");
});

test("marks observations over the hash bound as truncated", () => {
  const writes = buildCatalogVersionWrites("workspace-1", [{ server_id: server, catalog_kind: "tools", catalog_item_count: 129, catalog_item_name_hashes: [hash] }]);
  assert.equal(writes[0].complete, false);
  assert.equal(writes[0].truncated, true);
});

test("ignores malformed foreign-key identifiers and raw names", () => {
  const writes = buildCatalogVersionWrites("workspace-1", [{ server_id: "not-a-uuid", catalog_kind: "tools", catalog_item_count: 1, catalog_item_name_hashes: ["raw-name"] }]);
  assert.deepEqual(writes, []);
});

test("joins a changed snapshot to the previous bounded version", () => {
  const writes = buildCatalogVersionWrites("workspace-1", [{ server_id: server, environment_id: environment, catalog_kind: "tools", catalog_item_count: 2, catalog_item_name_hashes: [hash, "b".repeat(64)], started_at: "2026-01-02T00:00:00Z" }], [{ id: "previous-id", server_id: server, environment_id: environment, catalog_kind: "tools", item_count: 1, item_name_hashes: [hash], item_uri_hashes: [], snapshot_hash: "c".repeat(64), complete: true, truncated: false, discovered_at: "2026-01-01T00:00:00Z" }]);
  assert.equal(writes[0].previous_snapshot_id, "previous-id");
  assert.equal(writes[0].diff.status, "computed");
  assert.equal(writes[0].diff.added_name_count, 1);
  assert.deepEqual(writes[0].diff.removed_name_hashes, []);
});
