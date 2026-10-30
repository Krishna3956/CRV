import test from "node:test";
import assert from "node:assert/strict";
import { clampExportLimit, projectAction, projectActivationMilestone, projectCatalogEntityRead, projectCatalogVersion, projectEvent, projectFact, PRIVACY_EXPORT_VERSION } from "./privacy-export.ts";

test("privacy export omits payloads and pseudonymous account keys", () => {
  const result = projectEvent({ id: "1", payload: { secret: "no" }, account_key: "a".repeat(64), tool_name: "search", success: true });
  assert.equal(result.tool_name, "search");
  assert.equal("payload" in result, false);
  assert.equal("account_key" in result, false);
});

test("privacy export preserves bounded action evidence without secrets", () => {
  const result = projectAction({ id: "1", title: "Investigate errors", evidence: { count: 3 }, api_key: "tmcp_secret" });
  assert.deepEqual(result.evidence, { count: 3 });
  assert.equal("api_key" in result, false);
});

test("privacy export limits are bounded and versioned", () => {
  assert.equal(clampExportLimit("99999"), 500);
  assert.equal(clampExportLimit("0"), 1);
  assert.equal(clampExportLimit("bad"), 100);
  assert.match(PRIVACY_EXPORT_VERSION, /^\d{4}-\d{2}-\d{2}/);
});

test("privacy export includes bounded catalog and activation evidence without raw secrets", () => {
  const catalog = projectCatalogVersion({ item_count: 2, item_name_hashes: ["a".repeat(64), "b".repeat(64), "c".repeat(64), "not-a-hash"], catalog: { raw: "must-not-export" }, api_key: "tmcp_secret" });
  assert.equal(Array.isArray(catalog.item_name_hashes) ? catalog.item_name_hashes.length : -1, 3);
  assert.equal("catalog" in catalog, false);
  assert.equal("api_key" in catalog, false);
  const milestone = projectActivationMilestone({ workspace_id: "ws", service: "demo", key_id: "secret-key-id", event_type: "tool_call" });
  assert.equal(milestone.service, "demo");
  assert.equal("key_id" in milestone, false);
});

test("privacy export includes hash-only catalog entity reads without content", () => {
  const result = projectCatalogEntityRead({ source_event_id: "read-1", catalog_kind: "resources", transport: "streamable_http", entity_hash: "A".repeat(64), payload: { text: "private" }, uri: "secret://private" });
  assert.equal(result.catalog_kind, "resources");
  assert.equal(result.transport, "streamable_http");
  assert.equal(result.entity_hash, "a".repeat(64));
  assert.equal("payload" in result, false);
  assert.equal("uri" in result, false);
});

test("privacy export fails closed for an unsupported catalog transport", () => {
  const result = projectCatalogEntityRead({ catalog_kind: "prompts", transport: "tcp", entity_hash: "B".repeat(64) });
  assert.equal(result.transport, "unknown");
});

test("disposable workspace review excludes secret and raw-content markers from every projection", () => {
  const marker = "DISPOSABLE-SECRET-MARKER";
  const rows = [
    projectEvent({ id: "event-disposable", payload: marker, account_key: marker, email: marker, ip_address: marker }),
    projectFact({
      source_event_id: "fact-disposable",
      semantic: { source_event_id: "fact-disposable", data_quality: { flags: ["legacy_schema"], score: "degraded" }, payload: marker },
      dimensions: { account_key: marker, interaction_id: marker, tool_name: "search", payload: marker },
      measures: { duration_ms: 10, payload: marker },
      error: { class: "validation", raw_body: marker },
    }),
    projectAction({ evidence: { count: 3, payload: marker, token: marker, tool_name: "search" }, api_key: marker }),
    projectCatalogVersion({ diff: { raw_body: marker }, item_name_hashes: ["hash-a"], api_key: marker }),
    projectCatalogEntityRead({ payload: marker, uri: marker, entity_hash: "A".repeat(64) }),
    projectActivationMilestone({ key_id: marker, workspace_id: "workspace-disposable" }),
  ];
  assert.equal(JSON.stringify(rows).includes(marker), false);
  assert.equal(JSON.stringify(rows).includes("account_key"), false);
  assert.equal(JSON.stringify(rows).includes("interaction_id"), false);
});
