import assert from "node:assert/strict";
import test from "node:test";
import { buildCatalogEntityReadWrites, entityProjectionFingerprint } from "./catalog-entities.ts";

const workspace = "11111111-1111-4111-8111-111111111111";
const resourceHash = "a".repeat(64);
const promptHash = "b".repeat(64);

test("projects one hash-only resource or prompt read per source event", () => {
  const writes = buildCatalogEntityReadWrites(workspace, [
    { event_id: "resource-event", mcp_method: "resources/read", catalog_kind: "resources", catalog_item_uri_hashes: [resourceHash, resourceHash], started_at: "2026-01-01T00:00:00Z", success: true, is_error: false },
    { event_id: "prompt-event", mcp_method: "prompts/get", catalog_kind: "prompts", catalog_item_name_hashes: [promptHash], started_at: "2026-01-01T00:01:00Z", success: false, is_error: true, result_type: "input_required" },
    { event_id: "legacy-resource-event", mcp_method: "resources/read", catalog_item_uri_hashes: [resourceHash], started_at: "2026-01-01T00:01:30Z" },
    { event_id: "legacy-prompt-event", mcp_method: "prompts/get", catalog_item_name_hashes: [promptHash], started_at: "2026-01-01T00:01:45Z" },
    { event_id: "list-event", mcp_method: "resources/list", catalog_kind: "resources", catalog_item_uri_hashes: [resourceHash], started_at: "2026-01-01T00:02:00Z" },
  ]);
  assert.equal(writes.length, 3);
  assert.equal(writes[0]?.catalog_kind, "prompts");
  assert.equal(writes[0]?.entity_hash, promptHash);
  assert.equal(writes[0]?.result_type, "input_required");
  assert.deepEqual(writes.slice(1).map((write) => write.catalog_kind), ["resources", "prompts"]);
  assert.equal(entityProjectionFingerprint(writes[0]!).length, 64);
  assert.doesNotMatch(JSON.stringify(writes), /private|uri|prompt-name/i);
});

test("ignores malformed, unsupported, and ambiguous read observations", () => {
  const writes = buildCatalogEntityReadWrites(workspace, [
    { event_id: "bad", mcp_method: "resources/read", catalog_kind: "resources", catalog_item_uri_hashes: ["raw-uri"], started_at: "2026-01-01T00:00:00Z" },
    { event_id: "ambiguous", mcp_method: "prompts/get", catalog_kind: "prompts", catalog_item_name_hashes: [promptHash, resourceHash], started_at: "2026-01-01T00:00:00Z" },
    { event_id: "bad-time", mcp_method: "resources/read", catalog_kind: "resources", catalog_item_uri_hashes: [resourceHash], started_at: "not-a-date" },
  ]);
  assert.deepEqual(writes, []);
});
