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

test("new accepted batches in the same window receive distinct privacy-safe dedupe fingerprints", () => {
  const first = buildTrackMCPRefreshEnqueueRows(workspace, now, refreshBatchFingerprint(["event-a"]));
  const second = buildTrackMCPRefreshEnqueueRows(workspace, now, refreshBatchFingerprint(["event-b"]));
  assert.notEqual(first[0].dedupe_key, second[0].dedupe_key);
  assert.match(first[0].dedupe_key, /[a-f0-9]{64}/);
});
