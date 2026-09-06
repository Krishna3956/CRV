import assert from "node:assert/strict";
import test from "node:test";
import { correlationQualityForEvents, percentile } from "./analytics.ts";
import { traceResponse, traceScope } from "./trace.ts";

test("percentile uses nearest-rank ordering and returns null for no samples", () => {
  assert.equal(percentile([], 0.5), null);
  assert.equal(percentile([40, 10, 30, 20], 0.5), 20);
  assert.equal(percentile([40, 10, 30, 20], 0.95), 40);
  assert.equal(percentile([7], 0.5), 7);
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
  assert.equal(traceResponse("session-a", [{ session_id_source: "protocol" } as never]).correlation_quality, "session_id");
  assert.equal(traceResponse("session-a", [{ session_id_source: "transport_generated" } as never]).correlation_quality, "transport_generated");
  assert.equal(traceResponse("session-a", [{ session_id_source: "missing" } as never]).correlation_quality, "missing");
});
