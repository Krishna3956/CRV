import assert from "node:assert/strict";
import test from "node:test";
import { decodeCatalogCursor, encodeCatalogCursor } from "./catalog-cursor.ts";

test("catalog history cursors are opaque and round-trip for their workspace", () => {
  const cursor = encodeCatalogCursor("workspace-a", "2026-10-28T10:20:30.000Z");
  assert.ok(cursor);
  assert.equal(cursor.includes("2026-10-28"), false);
  assert.equal(cursor.includes("workspace-a"), false);
  assert.equal(decodeCatalogCursor(cursor, "workspace-a"), "2026-10-28T10:20:30.000Z");
});

test("catalog history cursors cannot be replayed across workspaces", () => {
  const cursor = encodeCatalogCursor("workspace-a", "2026-10-28T10:20:30.000Z");
  assert.equal(decodeCatalogCursor(cursor, "workspace-b"), null);
  assert.equal(decodeCatalogCursor("not-a-cursor", "workspace-a"), null);
  assert.equal(decodeCatalogCursor(null, "workspace-a"), null);
});

test("invalid catalog timestamps are never emitted", () => {
  assert.equal(encodeCatalogCursor("workspace-a", "not-a-date"), null);
  assert.equal(encodeCatalogCursor("", "2026-10-28T10:20:30.000Z"), null);
});

