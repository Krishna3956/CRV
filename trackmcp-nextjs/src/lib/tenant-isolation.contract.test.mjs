import test from "node:test";
import assert from "node:assert/strict";
import { createAnalyticsHandler } from "../app/api/v1/analytics/handlers.ts";
import { createCatalogsHandler } from "../app/api/v2/catalogs/handlers.ts";
import { createVersionedActionQueueHandler } from "../app/api/v2/action-queue/handlers.ts";
import { createDataTrustHandler } from "../app/api/v2/data-trust/handlers.ts";
import { createJourneysHandler } from "../app/api/v2/journeys/handlers.ts";
import { createOutcomesHandler } from "../app/api/v2/outcomes/handlers.ts";
import { createOverviewHandler } from "../app/api/v2/overview/handlers.ts";
import { createPeopleHandler } from "../app/api/v2/people/handlers.ts";
import { createPromptsHandler } from "../app/api/v2/prompts/handlers.ts";
import { createReliabilityHandler } from "../app/api/v2/reliability/handlers.ts";
import { createResourcesHandler } from "../app/api/v2/resources/handlers.ts";
import { createToolsHandler } from "../app/api/v2/tools/handlers.ts";
import { createActionQueueHandlers } from "../app/api/v1/action-queue/handlers.ts";
import { createToolQualityHandler } from "../app/api/v1/tool-quality/handlers.ts";
import { hashTrackMCPKey } from "./telemetry/keys.ts";
import { readFile } from "node:fs/promises";

// A deliberately small Supabase-shaped fixture. It applies the same chained
// filters used by the routes, allowing the contract to prove that a request
// authenticated for tenant A cannot receive tenant B rows without touching a
// production database.
class FixtureQuery {
  constructor(rows) { this.rows = rows; this.filters = []; this.result = null; }
  select() { return this; }
  eq(column, value) { this.filters.push((row) => row[column] === value); return this; }
  in(column, values) { this.filters.push((row) => values.includes(row[column])); return this; }
  gte(column, value) { this.filters.push((row) => String(row[column]) >= String(value)); return this; }
  order() { return this; }
  limit(value) { this.result = this.filtered().slice(0, value); return this; }
  maybeSingle() { this.result = this.filtered()[0] || null; return this; }
  single() { this.result = this.filtered()[0] || null; return this; }
  filtered() { return this.rows.filter((row) => this.filters.every((filter) => filter(row))); }
  then(resolve, reject) { return Promise.resolve({ data: this.result ?? this.filtered(), error: null }).then(resolve, reject); }
}

function fixtureAdmin() {
  const keyA = "tmcp_fixture_workspace_a";
  const keyB = "tmcp_fixture_workspace_b";
  const now = new Date().toISOString();
  const tables = {
    trackmcp_api_keys: [
      { key_hash: hashTrackMCPKey(keyA), workspace_id: "workspace-a", revoked_at: null },
      { key_hash: hashTrackMCPKey(keyB), workspace_id: "workspace-b", revoked_at: null },
    ],
    trackmcp_events: [
      { workspace_id: "workspace-a", event_id: "event-a", schema_version: "2", event_type: "tool_call", service: "a", environment: "prod", observation_source: "server", tool_name: "tool-a", started_at: now, success: true, is_error: false, payload: null },
      { workspace_id: "workspace-b", event_id: "event-b", schema_version: "2", event_type: "tool_call", service: "b", environment: "prod", observation_source: "server", tool_name: "tool-b", started_at: now, success: true, is_error: false, payload: null },
    ],
    trackmcp_action_queue: [
      { workspace_id: "workspace-a", id: "action-a", fingerprint: "a", rule_key: "a", status: "open", severity: "info", title: "A", evidence: {}, created_at: now, updated_at: now, revision: 1 },
      { workspace_id: "workspace-b", id: "action-b", fingerprint: "b", rule_key: "b", status: "open", severity: "info", title: "B", evidence: {}, created_at: now, updated_at: now, revision: 1 },
    ],
    trackmcp_catalog_versions: [
      { workspace_id: "workspace-a", id: "catalog-a", snapshot_hash: "a".repeat(64), catalog_kind: "tools", item_count: 1, item_name_hashes: ["c".repeat(64)], item_uri_hashes: [], previous_snapshot_id: "catalog-a-prev", complete: true, truncated: false, diff: { status: "computed", changed: true }, discovered_at: now },
      { workspace_id: "workspace-a", id: "catalog-a-prev", snapshot_hash: "d".repeat(64), catalog_kind: "tools", item_count: 2, item_name_hashes: ["e".repeat(64)], item_uri_hashes: [], previous_snapshot_id: null, complete: true, truncated: false, diff: { status: "unchanged" }, discovered_at: new Date(Date.now() - 2 * 86400000).toISOString() },
      { workspace_id: "workspace-b", id: "catalog-b", snapshot_hash: "b".repeat(64), catalog_kind: "tools", item_count: 2, item_name_hashes: [], item_uri_hashes: [], previous_snapshot_id: null, complete: true, truncated: false, diff: { status: "unchanged" }, discovered_at: now },
    ],
    trackmcp_workspace_members: [
      { user_id: "user-a", workspace_id: "workspace-a", role: "owner" },
      { user_id: "user-b", workspace_id: "workspace-b", role: "owner" },
    ],
  };
  return { from(table) { return new FixtureQuery(tables[table] || []); }, keyA, keyB };
}

const request = (path, key) => new Request(`https://trackmcp.test${path}`, { headers: { authorization: `Bearer ${key}` } });

test("analytics and every analytics-backed v2 read are tenant-scoped", async () => {
  const admin = fixtureAdmin();
  const response = await createAnalyticsHandler(() => admin, () => ({ auth: { getUser: async () => ({ data: { user: null } }) } }))(request("/api/v1/analytics?days=1", admin.keyA));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.total_events, 1);
  assert.deepEqual(body.tools.map((tool) => tool.name), ["tool-a"]);
  assert.equal(JSON.stringify(body).includes("tool-b"), false);
});

test("catalog history is tenant-scoped through the analytics projection", async () => {
  const admin = fixtureAdmin();
  const analytics = createAnalyticsHandler(() => admin, () => ({ auth: { getUser: async () => ({ data: { user: null } }) } }));
  const response = await createCatalogsHandler(analytics)(request("/api/v2/catalogs?days=1", admin.keyA));
  assert.equal(response.status, 200);
  const body = await response.json();
  const current = body.catalogs.find((catalog) => catalog.id === "catalog-a");
  assert.ok(current);
  assert.equal(current.previous_snapshot_status, "available");
  assert.equal(current.previous_snapshot.id, "catalog-a-prev");
  assert.equal(current.previous_snapshot.version, "d".repeat(64));
  assert.deepEqual(current.previous_snapshot.item_name_hashes, ["e".repeat(64)]);
  assert.equal(JSON.stringify(body).includes("catalog-b"), false);
  assert.equal(JSON.stringify(body).includes("b".repeat(64)), false);
});

test("every analytics-backed v2 projection preserves the authenticated workspace boundary", async () => {
  const admin = fixtureAdmin();
  const analytics = createAnalyticsHandler(() => admin, () => ({ auth: { getUser: async () => ({ data: { user: null } }) } }));
  const handlers = [
    ["overview", createOverviewHandler(analytics)],
    ["data-trust", createDataTrustHandler(analytics)],
    ["journeys", createJourneysHandler(analytics)],
    ["outcomes", createOutcomesHandler(analytics)],
    ["people", createPeopleHandler(analytics)],
    ["prompts", createPromptsHandler(analytics)],
    ["reliability", createReliabilityHandler(analytics)],
    ["resources", createResourcesHandler(analytics)],
    ["tools", createToolsHandler(analytics)],
  ];
  for (const [name, handler] of handlers) {
    const response = await handler(request(`/api/v2/${name}?days=1`, admin.keyA));
    assert.equal(response.status, 200, `${name} should authorize workspace A (got ${response.status})`);
    const body = await response.json();
    assert.equal(JSON.stringify(body).includes("tool-b"), false, `${name} leaked workspace B tool data`);
    assert.equal(JSON.stringify(body).includes("service-b"), false, `${name} leaked workspace B service data`);
  }
  const queueHandler = createVersionedActionQueueHandler(
    createActionQueueHandlers(() => admin, () => ({ auth: { getUser: async () => ({ data: { user: { id: "user-a" } } }) } })).GET,
  );
  const queueResponse = await queueHandler(new Request("https://trackmcp.test/api/v2/action-queue?workspace_id=workspace-a"));
  assert.equal(queueResponse.status, 200);
  assert.equal(JSON.stringify(await queueResponse.json()).includes("action-b"), false);
});

test("action queue reads are tenant-scoped and never cross the fixture boundary", async () => {
  const admin = fixtureAdmin();
  const response = await createActionQueueHandlers(() => admin, () => ({ auth: { getUser: async () => ({ data: { user: { id: "user-a" } } }) } })).GET(new Request("https://trackmcp.test/api/v1/action-queue?workspace_id=workspace-a"));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body.data.map((item) => item.id), ["action-a"]);
  assert.equal(JSON.stringify(body).includes("action-b"), false);
});

test("tool-quality reads remain bound to the API key workspace", async () => {
  const admin = fixtureAdmin();
  const handler = createToolQualityHandler(() => admin, async () => ({ auth: { getUser: async () => ({ data: { user: null } }) } }));
  const response = await handler(request("/api/v1/tool-quality?days=1", admin.keyA));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.source_event_count, 1);
  assert.equal(JSON.stringify(body).includes("tool-b"), false);
});

test("route source contracts require workspace scoping for all Founder OS account and queue surfaces", async () => {
  const root = new URL("../app/api/", import.meta.url);
  const files = [
    "v1/analytics/handlers.ts",
    "v1/action-queue/handlers.ts",
    "v1/action-queue/[id]/handlers.ts",
    "v1/account/export/route.ts",
    "v1/account/privacy-request/handlers.ts",
    "v2/catalogs/handlers.ts",
    "v2/tools/handlers.ts",
  ];
  for (const relative of files) {
    const source = await readFile(new URL(relative, root), "utf8");
    assert.match(source, /workspace_id|workspaceId|workspaceIds|createAnalyticsHandler|createActionQueueHandlers/, `${relative} must carry workspace scope`);
  }
  const analytics = await readFile(new URL("v1/analytics/handlers.ts", root), "utf8");
  assert.match(analytics, /\.eq\("workspace_id", workspaceId\)/);
  const queue = await readFile(new URL("v1/action-queue/handlers.ts", root), "utf8");
  assert.match(queue, /\.eq\("workspace_id", auth\.workspaceId\)/);
  const item = await readFile(new URL("v1/action-queue/[id]/handlers.ts", root), "utf8");
  assert.match(item, /\.eq\("workspace_id", auth\.workspaceId\).*\.eq\("id", id\)/s);
  const exportRoute = await readFile(new URL("v1/account/export/route.ts", root), "utf8");
  assert.match(exportRoute, /\.in\("workspace_id", workspaceIds\)/);
  const privacy = await readFile(new URL("v1/account/privacy-request/handlers.ts", root), "utf8");
  assert.match(privacy, /\.eq\("requester_user_id", user\.id\)/);
});

test("browser-scoped routes reject ambiguous workspace selection", async () => {
  const root = new URL("../app/api/", import.meta.url);
  const requiredWorkspaceSources = [
    "v1/analytics/handlers.ts",
    "v1/tool-quality/handlers.ts",
    "v1/traces/handlers.ts",
    "v1/account/keys/[id]/route.ts",
    "v1/account/workspace/route.ts",
  ];
  for (const relative of requiredWorkspaceSources) {
    const source = await readFile(new URL(relative, root), "utf8");
    assert.match(source, /workspace_id|requiredWorkspaceId|requestedWorkspaceId/, `${relative} must require or validate an explicit workspace`);
  }
  const analytics = await readFile(new URL("v1/analytics/handlers.ts", root), "utf8");
  const quality = await readFile(new URL("v1/tool-quality/handlers.ts", root), "utf8");
  const traces = await readFile(new URL("v1/traces/handlers.ts", root), "utf8");
  assert.match(analytics, /workspace_id is required/);
  assert.match(quality, /workspace_id is required/);
  assert.match(traces, /workspaceId: null, status: 400/);
});
