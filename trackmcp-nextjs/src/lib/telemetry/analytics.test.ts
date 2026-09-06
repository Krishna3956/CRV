import assert from "node:assert/strict";
import test from "node:test";
import { completedForEvents, completionSourceForEvents, correlationQualityForEvents, percentile } from "./analytics.ts";
import { traceResponse, traceScope } from "./trace.ts";

test("percentile uses nearest-rank ordering and returns null for no samples", () => {
  assert.equal(percentile([], 0.5), null);
  assert.equal(percentile([40, 10, 30, 20], 0.5), 20);
  assert.equal(percentile([40, 10, 30, 20], 0.95), 40);
  assert.equal(percentile([7], 0.5), 7);
  assert.equal(percentile([10, 20, 30, 40, 50], 0.5), 30);
  assert.equal(percentile([10, 20, 30, 40, 50], 0.95), 50);
  assert.equal(percentile([10, Number.NaN, 30], 0.5), 10);
});

test("completion source distinguishes workflow events from session heuristics", () => {
  const workflow = { event_type: "workflow", payload: { name: "workflow", workflow_name: "checkout", status: "completed" } };
  assert.equal(completionSourceForEvents([workflow]), "workflow_events");
  assert.equal(completedForEvents([workflow], () => true), true);
  assert.equal(completionSourceForEvents([{ event_type: "tool_call" }]), "session_heuristic");
  assert.equal(completedForEvents([{ event_type: "tool_call", success: true }], () => false), true);
  assert.equal(completionSourceForEvents([{ event_type: "protocol" }]), "none");
});

test("correlation quality follows explicit session ID provenance", () => {
  assert.equal(correlationQualityForEvents([{ session_id: "protocol-session", session_id_source: "protocol" }]), "session_id");
  assert.equal(correlationQualityForEvents([{ session_id: "fallback", session_id_source: "transport_generated" }]), "transport_generated");
  assert.equal(correlationQualityForEvents([{ session_id: null, session_id_source: "missing" }]), "missing");
  assert.equal(correlationQualityForEvents([{ session_id: "legacy-session", session_id_source: null }]), "missing");
  assert.equal(correlationQualityForEvents([
    { session_id: "protocol-session", session_id_source: "protocol" },
    { session_id: "fallback", session_id_source: "transport_generated" },
  ]), "mixed");
});

test("trace scope always includes both workspace and session filters", () => {
  assert.deepEqual(traceScope("workspace-a", "session-a"), { workspaceId: "workspace-a", sessionId: "session-a" });
  assert.notDeepEqual(traceScope("workspace-a", "session-a"), traceScope("workspace-b", "session-a"));
});

test("trace responses expose provenance-derived quality labels", () => {
  const response = traceResponse("session-a", [{ session_id_source: "protocol", event_type: "tool_call" } as never]);
  assert.equal(response.correlation_quality, "session_id");
  assert.equal(response.completion_source, "session_heuristic");
  assert.equal(response.event_count, 1);
  assert.equal(response.truncated, false);
  assert.equal(traceResponse("session-a", [{ session_id_source: "transport_generated" } as never]).correlation_quality, "transport_generated");
  assert.equal(traceResponse("session-a", [{ session_id_source: "missing" } as never]).correlation_quality, "missing");
  assert.equal(traceResponse("session-a", [], { truncated: true }).truncated, true);
});
