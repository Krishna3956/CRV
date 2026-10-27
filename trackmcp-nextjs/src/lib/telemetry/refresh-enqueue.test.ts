import assert from "node:assert/strict";
import test from "node:test";
import { buildTrackMCPRefreshEnqueueRows, enqueueTrackMCPRefreshJobs, refreshBatchFingerprint, TRACKMCP_INGEST_REFRESH_KINDS } from "./refresh-enqueue.ts";

const workspace = "workspace_1";
const now = new Date("2026-10-20T00:01:00.000Z");

test("refresh enqueue covers every non-destructive derived job class in one bounded window", () => {
  const rows = buildTrackMCPRefreshEnqueueRows(workspace, now);
  assert.deepEqual(rows.map((row) => row.kind), TRACKMCP_INGEST_REFRESH_KINDS);
  assert.equal(rows.every((row) => row.workspace_id === workspace && row.dedupe_key.startsWith("ingest-window:")), true);
  assert.equal(rows.map((row) => row.kind as string).includes("retention_cleanup"), false);
  assert.equal(JSON.stringify(rows).includes("raw"), false);
});

test("refresh enqueue is idempotent at the database conflict boundary", async () => {
  const writes: unknown[] = [];
  const client = { from(table: "trackmcp_refresh_jobs") { assert.equal(table, "trackmcp_refresh_jobs"); return { upsert(rows: unknown[], options: unknown) { writes.push({ rows, options }); return Promise.resolve({ error: null }); } }; } };
  const result = await enqueueTrackMCPRefreshJobs(client, workspace, now);
  assert.equal(result.attempted, 4);
  assert.equal(result.error, null);
  assert.deepEqual((writes[0] as { options: unknown }).options, { onConflict: "workspace_id,kind,dedupe_key", ignoreDuplicates: true });
});

test("refresh enqueue rejects malformed workspace scope before a write", async () => {
  let called = false;
  const client = { from() { called = true; return { upsert() { return Promise.resolve({ error: null }); } }; } };
  const result = await enqueueTrackMCPRefreshJobs(client as never, "bad\nworkspace", now);
  assert.deepEqual(result, { attempted: 0, error: null });
  assert.equal(called, false);
});

test("accepted batches in the same window coalesce to one bounded projection job", () => {
  const first = buildTrackMCPRefreshEnqueueRows(workspace, now, refreshBatchFingerprint(["event-a"]));
  const second = buildTrackMCPRefreshEnqueueRows(workspace, now, refreshBatchFingerprint(["event-b"]));
  assert.equal(first[0].dedupe_key, second[0].dedupe_key);
  assert.match(first[0].dedupe_key, /^ingest-window:\d+:fact_projection$/);
});

test("legacy deployments retain fingerprinted fallback rows when the RPC is unavailable", async () => {
  const writes: unknown[] = [];
  const client = { from() { return { upsert(rows: unknown[], options: unknown) { writes.push({ rows, options }); return Promise.resolve({ error: null }); } }; } };
  const result = await enqueueTrackMCPRefreshJobs(client, workspace, now, refreshBatchFingerprint(["event-a"]));
  assert.equal(result.attempted, 4);
  const rows = (writes[0] as { rows: Array<{ dedupe_key: string }> }).rows;
  assert.ok(rows.every((row) => /ingest-window:\d+:[a-f0-9]{64}:[a-z_]+$/.test(row.dedupe_key)));
});

test("coalescing RPC receives only bounded workspace/window metadata", async () => {
  const calls: unknown[] = [];
  const client = {
    rpc(name: string, args: unknown) { calls.push({ name, args }); return Promise.resolve({ error: null }); },
    from() { throw new Error("fallback must not run"); },
  };
  const result = await enqueueTrackMCPRefreshJobs(client, workspace, now, refreshBatchFingerprint(["event-a"]));
  assert.deepEqual(result, { attempted: 4, error: null });
  assert.deepEqual(calls, [{ name: "trackmcp_enqueue_refresh_jobs", args: { p_workspace_id: workspace, p_window: Math.floor(now.getTime() / (15 * 60 * 1000)), p_requested_at: now.toISOString() } }]);
});
