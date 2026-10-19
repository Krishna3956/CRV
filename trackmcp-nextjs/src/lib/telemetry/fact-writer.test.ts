import test from "node:test";
import assert from "node:assert/strict";
import { projectTrackMCPFact } from "./facts.ts";
import { persistTrackMCPFacts, toSemanticFactRow } from "./fact-writer.ts";
import type { CanonicalTrackMCPEvent } from "./types.ts";

const event = (overrides: Partial<CanonicalTrackMCPEvent> = {}): CanonicalTrackMCPEvent => ({
  schema_version: "1", event_id: "evt_writer_1", event_type: "tool_call", service: "svc", environment: "prod",
  started_at: "2026-10-18T00:00:00.000Z", tool_name: "search", duration_ms: 12, success: true,
  request_id: "request-must-not-be-written", correlation_handle: "handle-must-not-be-written",
  payload: { secret: "must-not-be-written", nested: { raw: true } }, ...overrides,
});

test("maps a projected fact to the additive database row", () => {
  const row = toSemanticFactRow("workspace-1", projectTrackMCPFact(event()));
  assert.equal(row.workspace_id, "workspace-1");
  assert.equal(row.source_event_id, "evt_writer_1");
  assert.equal("payload" in row, false);
  assert.equal("request_id" in row, false);
  assert.equal("correlation_handle" in row, false);
  assert.deepEqual(row.dimensions.tool_name, "search");
});

test("upserts only bounded fact rows with the migration conflict key", async () => {
  let captured: unknown;
  const client = { from(table: string) {
    assert.equal(table, "trackmcp_semantic_facts");
    return { upsert(rows: unknown[], options: unknown) { captured = { rows, options }; return Promise.resolve({ error: null }); } };
  } };
  const result = await persistTrackMCPFacts(client, "workspace-1", [projectTrackMCPFact(event())]);
  assert.equal(result.attempted, 1);
  assert.equal(result.error, null);
  assert.deepEqual((captured as { options: unknown }).options, { onConflict: "workspace_id,source_event_id,fact_version", ignoreDuplicates: false });
  const row = (captured as { rows: Array<Record<string, unknown>> }).rows[0];
  assert.equal("payload" in row, false);
  assert.equal("request_id" in row, false);
  assert.equal("correlation_handle" in row, false);
});

