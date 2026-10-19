import assert from "node:assert/strict";
import test from "node:test";
import { diffCatalogSnapshots, normalizeCatalogSnapshot } from "./catalog-snapshots.ts";

const a = "a".repeat(64);
const b = "b".repeat(64);
const c = "c".repeat(64);

function snapshot(hash: string, names: string[], extra: Partial<{ complete: boolean; truncated: boolean; catalog_kind: "tools" | "resources" | "resource_templates" | "prompts" }> = {}) {
  const result = normalizeCatalogSnapshot({ snapshot_hash: hash, catalog_kind: extra.catalog_kind || "tools", item_count: names.length, item_name_hashes: names, complete: extra.complete ?? true, truncated: extra.truncated ?? false });
  assert.equal(result.ok, true);
  return result.snapshot;
}

test("normalizes and bounds privacy-safe snapshot hashes", () => {
  const result = normalizeCatalogSnapshot({ snapshot_hash: a, catalog_kind: "tools", item_count: 3, item_name_hashes: [b.toUpperCase(), b, "raw-tool-name"], complete: true });
  assert.equal(result.ok, true);
  assert.deepEqual(result.snapshot.item_name_hashes, [b]);
});

test("diff reports additions and removals for complete same-kind snapshots", () => {
  const before = snapshot(a, [b, c]);
  const after = snapshot("d".repeat(64), [b, "e".repeat(64)]);
  const result = diffCatalogSnapshots(before, after);
  assert.equal(result.comparable, true);
  assert.equal(result.changed, true);
  assert.deepEqual(result.added_name_hashes, ["e".repeat(64)]);
  assert.deepEqual(result.removed_name_hashes, [c]);
});

test("truncated snapshots do not manufacture removals", () => {
  const before = snapshot(a, [b, c], { complete: false, truncated: true });
  const after = snapshot("d".repeat(64), [b]);
  const result = diffCatalogSnapshots(before, after);
  assert.equal(result.comparable, false);
  assert.deepEqual(result.removed_name_hashes, []);
});

test("rejects invalid snapshot identity and count", () => {
  assert.equal(normalizeCatalogSnapshot({ snapshot_hash: "not-a-hash", catalog_kind: "tools", item_count: 0 }).ok, false);
  assert.equal(normalizeCatalogSnapshot({ snapshot_hash: a, catalog_kind: "tools", item_count: -1 }).ok, false);
});
