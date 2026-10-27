import assert from "node:assert/strict";
import test from "node:test";
import { correlateCatalogNotifications } from "./catalog-correlations.ts";

test("correlates only a unique same-scope snapshot within the bounded window", () => {
  const result = correlateCatalogNotifications([
    { server_id: "server-a", environment: "prod", catalog_kind: "tools", started_at: "2026-10-27T10:00:00Z" },
    { server_id: "server-b", environment: "prod", catalog_kind: "tools", started_at: "2026-10-27T10:00:00Z" },
    { server_id: "server-a", environment: "prod", catalog_kind: "tools", started_at: "2026-10-27T11:00:00Z" },
  ], [
    { id: "snapshot-a", server_id: "server-a", environment_id: "prod", catalog_kind: "tools", discovered_at: "2026-10-27T10:05:00Z" },
  ]);
  const tools = result.find((row) => row.kind === "tools");
  assert.deepEqual(tools, {
    kind: "tools", notifications: 3, matched_notifications: 1,
    ambiguous_notifications: 0, unmatched_notifications: 2, snapshots: 1,
    match_window_ms: 600000, status: "available",
  });
});

test("never chooses a version when more than one snapshot is equally eligible", () => {
  const result = correlateCatalogNotifications([
    { server_id: "server-a", environment: "prod", catalog_kind: "resources", started_at: "2026-10-27T10:00:00Z" },
  ], [
    { id: "snapshot-a", server_id: "server-a", environment_id: "prod", catalog_kind: "resources", discovered_at: "2026-10-27T09:59:00Z" },
    { id: "snapshot-b", server_id: "server-a", environment_id: "prod", catalog_kind: "resources", discovered_at: "2026-10-27T10:01:00Z" },
  ]);
  const resources = result.find((row) => row.kind === "resources");
  assert.equal(resources?.matched_notifications, 0);
  assert.equal(resources?.ambiguous_notifications, 1);
  assert.equal(resources?.unmatched_notifications, 0);
});
