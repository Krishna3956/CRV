import assert from "node:assert/strict";
import test from "node:test";
import { createRefreshJob } from "./refresh-jobs.ts";
import { createRefreshJobHandlers } from "./refresh-handlers.ts";

const workspace = "11111111-1111-4111-8111-111111111111";
const baseJob = (kind: "fact_projection" | "action_queue_refresh") => {
  const result = createRefreshJob({ id: `${kind}-job`, workspace_id: workspace, kind, dedupe_key: `${kind}:1`, now: new Date("2026-01-01T00:00:00.000Z") });
  assert.equal(result.ok, true);
  if (!result.ok) throw new Error("fixture job could not be created");
  return result.job;
};

function fakeAdmin(eventRows: unknown[] = [], semanticRows: unknown[] = [], queryLog: string[] = []) {
  const writes: Array<{ table: string; rows: unknown[]; onConflict?: string }> = [];
  const admin = {
    from(table: string) {
      const rows = table === "trackmcp_events"
        ? eventRows
        : table === "trackmcp_servers"
          ? eventRows.map((row) => ({ id: row && typeof row === "object" ? (row as { server_id?: unknown }).server_id : null }))
          : semanticRows;
      const query = {
        select() { return query; },
        eq() { return query; },
        gte(column: string, value: string) { queryLog.push(`gte:${table}:${column}:${value}`); return query; },
        lt(column: string, value: string) { queryLog.push(`lt:${table}:${column}:${value}`); return query; },
        order() { return query; },
        limit: async () => ({ data: rows, error: null }),
        upsert: async (values: unknown[], options?: { onConflict?: string }) => { writes.push({ table, rows: values, onConflict: options?.onConflict }); return { error: null }; },
      };
      return query;
    },
  };
  return { admin, writes };
}

test("windowed ingest jobs restrict event projections to their source window", async () => {
  const queryLog: string[] = [];
  const { admin } = fakeAdmin([], [], queryLog);
  const result = createRefreshJob({
    id: "windowed-job",
    workspace_id: workspace,
    kind: "catalog_recompute",
    dedupe_key: "ingest-window:1965696:catalog_recompute",
    now: new Date("2026-01-01T00:00:00.000Z"),
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  await createRefreshJobHandlers(admin as never).catalog_recompute?.({ job: result.job, now: new Date() });
  assert.equal(queryLog.filter((entry) => entry.startsWith("gte:trackmcp_events:started_at:")).length, 1);
  assert.equal(queryLog.filter((entry) => entry.startsWith("lt:trackmcp_events:started_at:")).length, 1);
});

test("legacy fingerprinted ingest jobs still restrict projections to their source window", async () => {
  const queryLog: string[] = [];
  const { admin } = fakeAdmin([], [], queryLog);
  const result = createRefreshJob({
    id: "legacy-windowed-job",
    workspace_id: workspace,
    kind: "catalog_entity_recompute",
    dedupe_key: `ingest-window:1965696:${"a".repeat(64)}:catalog_entity_recompute`,
    now: new Date("2026-01-01T00:00:00.000Z"),
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  await createRefreshJobHandlers(admin as never).catalog_entity_recompute?.({ job: result.job, now: new Date() });
  assert.equal(queryLog.filter((entry) => entry.startsWith("gte:trackmcp_events:started_at:")).length, 1);
  assert.equal(queryLog.filter((entry) => entry.startsWith("lt:trackmcp_events:started_at:")).length, 1);
});

test("fact projection selects bounded metadata and persists semantic facts", async () => {
  const { admin, writes } = fakeAdmin([{ event_id: "evt-1", event_type: "tool_call", service: "demo", environment: "prod", started_at: "2026-01-01T00:00:00.000Z", success: true, is_error: false, tool_name: "search", transport: "stdio" }]);
  const handler = createRefreshJobHandlers(admin as never).fact_projection;
  assert.ok(handler);
  const result = await handler({ job: baseJob("fact_projection"), now: new Date(), signal: undefined });
  assert.deepEqual(result, { outcome: "succeeded" });
  assert.equal(writes.length, 1);
  assert.equal(writes[0]?.table, "trackmcp_semantic_facts");
  assert.equal((writes[0]?.rows[0] as { payload?: unknown }).payload, undefined);
});

test("task transition projection is enabled by default and writes only explicit task evidence", async () => {
  const event = {
    event_id: "task-event-1", event_type: "protocol", service: "demo", environment: "prod", started_at: "2026-01-01T00:00:00.000Z",
    task_id: "secret-task-handle", mcp_method: "tasks/get", payload: { task_status: "completed" }, success: true, is_error: false, transport: "streamable_http",
  };
  const disabled = fakeAdmin([event]);
  const disabledHandler = createRefreshJobHandlers(disabled.admin as never, { taskTransitionsEnabled: false }).fact_projection;
  assert.ok(disabledHandler);
  assert.deepEqual(await disabledHandler({ job: baseJob("fact_projection"), now: new Date() }), { outcome: "succeeded" });
  assert.equal(disabled.writes.some((write) => write.table === "trackmcp_task_transitions"), false);

  const enabled = fakeAdmin([event]);
  const enabledHandler = createRefreshJobHandlers(enabled.admin as never, { taskTransitionsEnabled: true }).fact_projection;
  assert.ok(enabledHandler);
  assert.deepEqual(await enabledHandler({ job: baseJob("fact_projection"), now: new Date() }), { outcome: "succeeded" });
  const transition = enabled.writes.find((write) => write.table === "trackmcp_task_transitions");
  assert.ok(transition);
  assert.equal((transition.rows[0] as { state?: string }).state, "completed");
  assert.equal(JSON.stringify(transition.rows).includes("secret-task-handle"), false);

  const defaultEnabled = fakeAdmin([event]);
  const defaultHandler = createRefreshJobHandlers(defaultEnabled.admin as never).fact_projection;
  assert.ok(defaultHandler);
  await defaultHandler({ job: baseJob("fact_projection"), now: new Date() });
  assert.equal(defaultEnabled.writes.some((write) => write.table === "trackmcp_task_transitions"), true);
});

test("action queue refresh defers cleanly on cancellation", async () => {
  const { admin } = fakeAdmin();
  const handler = createRefreshJobHandlers(admin as never).action_queue_refresh;
  assert.ok(handler);
  const controller = new AbortController();
  controller.abort();
  assert.deepEqual(await handler({ job: baseJob("action_queue_refresh"), now: new Date(), signal: controller.signal }), {
    outcome: "deferred", detail: "worker deadline deferred this job",
  });
});

test("catalog refresh is a bounded no-op without observations and retention remains fail-closed", async () => {
  const { admin } = fakeAdmin();
  const handlers = createRefreshJobHandlers(admin as never);
  assert.deepEqual(await handlers.catalog_recompute?.({ job: baseJob("fact_projection"), now: new Date() }), { outcome: "succeeded" });
  assert.deepEqual(await handlers.retention_cleanup?.({ job: baseJob("fact_projection"), now: new Date() }), { outcome: "failed", error_code: "approval_required", detail: "retention cleanup requires an approved dry-run batch" });
});

test("catalog refresh writes only hash-based version rows", async () => {
  const { admin, writes } = fakeAdmin([{ server_id: "11111111-1111-4111-8111-111111111111", catalog_kind: "tools", catalog_item_count: 1, catalog_item_name_hashes: ["a".repeat(64)], started_at: "2026-01-01T00:00:00Z" }]);
  const handler = createRefreshJobHandlers(admin as never).catalog_recompute;
  assert.ok(handler);
  assert.deepEqual(await handler({ job: baseJob("fact_projection"), now: new Date() }), { outcome: "succeeded" });
  const catalogWrite = writes.find((write) => write.table === "trackmcp_catalog_versions");
  assert.ok(catalogWrite);
  assert.equal((catalogWrite.rows[0] as { catalog?: unknown }).catalog, undefined);
  assert.equal((catalogWrite.rows[0] as { workspace_id?: unknown }).workspace_id, workspace);
  assert.equal((catalogWrite.rows[0] as { snapshot_hash?: unknown }).snapshot_hash?.toString().length, 64);
  assert.equal(catalogWrite.onConflict, "workspace_id,server_id,environment_id,catalog_kind,snapshot_hash");
});

test("catalog refresh preserves structured database error context", async () => {
  const admin = {
    from() {
      const query = {
        select() { return query; },
        eq() { return query; },
        order() { return query; },
        limit: async () => ({ data: null, error: { code: "42P10", message: "no unique or exclusion constraint matching the ON CONFLICT specification", details: "constraint mismatch", hint: "create a matching unique index" } }),
      };
      return query;
    },
  };
  const handler = createRefreshJobHandlers(admin as never).catalog_recompute;
  assert.ok(handler);
  const result = await handler({ job: baseJob("fact_projection"), now: new Date() });
  assert.deepEqual(result, {
    outcome: "retryable",
    error_code: "handler_failure",
    detail: "code=42P10; message=no unique or exclusion constraint matching the ON CONFLICT specification; details=constraint mismatch; hint=create a matching unique index",
  });
});

test("catalog entity refresh writes idempotent hash-only read rows", async () => {
  const { admin, writes } = fakeAdmin([{
    event_id: "resource-read-1",
    server_id: "server-1",
    environment: "production",
    mcp_method: "resources/read",
    catalog_kind: "resources",
    catalog_item_uri_hashes: ["a".repeat(64)],
    started_at: "2026-01-01T00:00:00Z",
    success: true,
    is_error: false,
  }]);
  const handler = createRefreshJobHandlers(admin as never).catalog_entity_recompute;
  assert.ok(handler);
  assert.deepEqual(await handler({ job: baseJob("fact_projection"), now: new Date() }), { outcome: "succeeded" });
  const entityWrite = writes.find((write) => write.table === "trackmcp_catalog_entity_reads");
  assert.ok(entityWrite);
  assert.equal((entityWrite.rows[0] as { entity_hash?: string }).entity_hash, "a".repeat(64));
  assert.equal((entityWrite.rows[0] as { payload?: unknown }).payload, undefined);
});
