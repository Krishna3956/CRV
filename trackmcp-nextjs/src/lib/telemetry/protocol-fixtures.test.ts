import assert from "node:assert/strict";
import test from "node:test";
import { classifyTrackMCPOutcome } from "./semantic.ts";
import type { CanonicalTrackMCPEvent } from "./types.ts";

const fixture = (overrides: Partial<CanonicalTrackMCPEvent> = {}): CanonicalTrackMCPEvent => ({
  schema_version: "1",
  event_id: "protocol-fixture",
  event_type: "protocol",
  service: "fixture-server",
  environment: "test",
  observation_source: "server",
  session_id: "session-fixture",
  started_at: "2026-10-18T00:00:00Z",
  ...overrides,
});

test("resource and prompt request outcomes preserve complete and input-required states", () => {
  assert.equal(classifyTrackMCPOutcome(fixture({ mcp_method: "resources/read", result_type: "complete" })).outcome, "completed");
  assert.equal(classifyTrackMCPOutcome(fixture({ mcp_method: "prompts/get", result_type: "input_required" })).outcome, "pending");
  // Legacy resource responses had no result_type; the compatibility rule is
  // limited to these request/response methods and does not affect notifications.
  assert.equal(classifyTrackMCPOutcome(fixture({ mcp_method: "resources/read" })).outcome, "completed");
});

test("sampling, elicitation, and completion fixtures do not become false successes", () => {
  assert.equal(classifyTrackMCPOutcome(fixture({ mcp_method: "sampling/createMessage", result_type: "input_required" })).outcome, "pending");
  assert.equal(classifyTrackMCPOutcome(fixture({ mcp_method: "elicitation/create", result_type: "input_required" })).outcome, "pending");
  assert.equal(classifyTrackMCPOutcome(fixture({ mcp_method: "completion/complete", result_type: "complete" })).outcome, "completed");
  assert.equal(classifyTrackMCPOutcome(fixture({ mcp_method: "sampling/createMessage", success: true })).outcome, "not_observable");
});

test("notifications, subscriptions, and transport lifecycle are activity, not business outcomes", () => {
  for (const mcp_method of [
    "notifications/tools/list_changed",
    "notifications/resources/list_changed",
    "notifications/prompts/list_changed",
    "notifications/cancelled",
    "resources/subscribe",
    "initialize",
    "notifications/initialized",
  ]) {
    const result = classifyTrackMCPOutcome(fixture({ mcp_method, success: true }));
    assert.equal(result.outcome, "not_observable", mcp_method);
    assert.equal(result.reason, "not_an_outcome_event", mcp_method);
  }
});

test("protocol errors take precedence over a claimed successful result", () => {
  const result = classifyTrackMCPOutcome(fixture({ mcp_method: "elicitation/create", result_type: "complete", success: true, is_error: true }));
  assert.equal(result.outcome, "unknown");
  assert.equal(result.evidence_quality, "conflicting");
  assert.equal(result.data_quality.score, "insufficient");
});
