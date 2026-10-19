import assert from "node:assert/strict";
import test from "node:test";
import { classifyTrackMCPOutcome, classifyTrackMCPProtocolSignal, toTrackMCPSemanticEvent } from "./semantic.ts";
import type { CanonicalTrackMCPEvent } from "./types.ts";

const event = (overrides: Partial<CanonicalTrackMCPEvent> = {}): CanonicalTrackMCPEvent => ({
  schema_version: "1", event_id: "evt_semantic_1", event_type: "tool_call", service: "fixture", environment: "test",
  observation_source: "server", session_id: "session_1", started_at: "2026-10-18T00:00:00Z", ...overrides,
});

test("classifies explicit tool outcomes without guessing from missing errors", () => {
  assert.equal(classifyTrackMCPOutcome(event({ success: true })).outcome, "completed");
  assert.equal(classifyTrackMCPOutcome(event({ is_error: true })).outcome, "failed");
  const unknown = classifyTrackMCPOutcome(event());
  assert.equal(unknown.outcome, "unknown");
  assert.equal(unknown.evidence_quality, "insufficient_data");
  assert.ok(unknown.data_quality.flags.includes("missing_terminal_signal"));
});

test("classifies workflow lifecycle events as observed semantic outcomes", () => {
  const completed = classifyTrackMCPOutcome(event({ event_type: "workflow", workflow_id: "wf_1", payload: { name: "workflow", workflow_name: "sync", status: "completed" } }));
  assert.deepEqual({ outcome: completed.outcome, scope: completed.scope, reason: completed.reason }, { outcome: "completed", scope: "workflow", reason: "workflow_completed" });
  assert.equal(classifyTrackMCPOutcome(event({ event_type: "workflow", payload: { name: "workflow", workflow_name: "sync", status: "started" } })).outcome, "pending");
});

test("marks conflicting result signals as untrustworthy", () => {
  const result = classifyTrackMCPOutcome(event({ success: true, is_error: true }));
  assert.equal(result.outcome, "unknown");
  assert.equal(result.evidence_quality, "conflicting");
  assert.equal(result.data_quality.score, "insufficient");
  assert.ok(result.data_quality.flags.includes("conflicting_result_signals"));
});

test("semantic event carries version and source identity", () => {
  const result = toTrackMCPSemanticEvent(event({ event_id: "evt_source" }));
  assert.equal(result.contract_version, "1");
  assert.equal(result.classifier_version, "1");
  assert.equal(result.source_event_id, "evt_source");
  assert.equal(result.outcome.scope, "tool_call");
});

test("legacy and uncorrelated input is degraded but still interpretable", () => {
  const result = classifyTrackMCPOutcome(event({ schema_version: "legacy", observation_source: undefined, session_id: undefined, success: true }));
  assert.equal(result.outcome, "completed");
  assert.equal(result.data_quality.score, "degraded");
  assert.ok(result.data_quality.flags.includes("legacy_schema"));
  assert.ok(result.data_quality.flags.includes("missing_observation_source"));
  assert.ok(result.data_quality.flags.includes("missing_correlation"));
});

test("does not treat generic protocol or custom success as a business outcome", () => {
  const source = event({ event_type: "protocol", success: true });
  const result = classifyTrackMCPOutcome(source);
  assert.equal(result.outcome, "not_observable");
  assert.equal(result.reason, "not_an_outcome_event");
});

test("classifies protocol notifications and subscriptions as lifecycle signals, not outcomes", () => {
  const changed = classifyTrackMCPOutcome(event({ event_type: "protocol", mcp_method: "notifications/tools/list_changed", success: true }));
  assert.equal(changed.protocol_signal, "catalog_changed");
  assert.equal(changed.outcome, "not_observable");

  const progress = classifyTrackMCPOutcome(event({ event_type: "protocol", mcp_method: "notifications/progress" }));
  assert.equal(progress.protocol_signal, "progress");
  assert.equal(progress.outcome, "not_observable");
  const resourceChanged = classifyTrackMCPOutcome(event({ event_type: "protocol", mcp_method: "notifications/resources/updated" }));
  assert.equal(resourceChanged.protocol_signal, "resource_changed");

  const started = classifyTrackMCPOutcome(event({ event_type: "protocol", mcp_method: "resources/subscribe" }));
  assert.equal(started.protocol_signal, "subscription_started");
  assert.equal(started.outcome, "not_observable");

  const stopped = classifyTrackMCPOutcome(event({ event_type: "protocol", mcp_method: "resources/unsubscribe" }));
  assert.equal(stopped.protocol_signal, "subscription_stopped");
  assert.equal(stopped.outcome, "not_observable");

  const modern = classifyTrackMCPOutcome(event({ event_type: "protocol", mcp_method: "subscriptions/listen", success: true }));
  assert.equal(modern.protocol_signal, "subscription_started");
  const acknowledged = classifyTrackMCPOutcome(event({ event_type: "protocol", mcp_method: "notifications/subscriptions/acknowledged" }));
  assert.equal(acknowledged.protocol_signal, "subscription_started");
});

test("protocol signal classifier is safe for unknown methods", () => {
  assert.equal(classifyTrackMCPProtocolSignal({ mcp_method: "experimental/custom" }), undefined);
  assert.equal(classifyTrackMCPProtocolSignal({ mcp_method: undefined }), undefined);
});

test("models MCP multi-round-trip result states without conflating stalls and errors", () => {
  const stalled = classifyTrackMCPOutcome(event({ mcp_method: "prompts/get", result_type: "input_required", interaction_id: "interaction_1", interaction_link_source: "issued" }));
  assert.equal(stalled.outcome, "pending");
  assert.equal(stalled.reason, "input_required");

  const complete = classifyTrackMCPOutcome(event({ mcp_method: "resources/read", result_type: "complete" }));
  assert.equal(complete.outcome, "completed");

  const legacyComplete = classifyTrackMCPOutcome(event({ mcp_method: "resources/read" }));
  assert.equal(legacyComplete.outcome, "completed");

  const errored = classifyTrackMCPOutcome(event({ mcp_method: "resources/read", result_type: "input_required", is_error: true }));
  assert.equal(errored.outcome, "failed");
});

test("treats a modern task result handle as pending until task state is observed", () => {
  const result = classifyTrackMCPOutcome(event({ event_type: "tool_call", mcp_method: "tools/call", task_id: "task_1", result_type: "task" }));
  assert.equal(result.outcome, "pending");
  assert.equal(result.reason, "task_pending");
  assert.equal(result.evidence_quality, "observed");
});

test("models explicit task lifecycle states without inferring abandonment", () => {
  const working = classifyTrackMCPOutcome(event({ event_type: "protocol", task_id: "task_1", mcp_method: "tasks/get", payload: { status: "working" } }));
  assert.deepEqual({ scope: working.scope, outcome: working.outcome, reason: working.reason, task_status: working.task_status }, { scope: "task", outcome: "pending", reason: "task_pending", task_status: "working" });
  const complete = classifyTrackMCPOutcome(event({ event_type: "protocol", task_id: "task_1", mcp_method: "tasks/get", payload: { status: "completed" } }));
  assert.equal(complete.outcome, "completed");
  assert.equal(complete.reason, "task_completed");
  const cancelled = classifyTrackMCPOutcome(event({ event_type: "protocol", task_id: "task_1", mcp_method: "tasks/cancel", payload: { status: "cancelled" } }));
  assert.equal(cancelled.outcome, "unknown");
  assert.equal(cancelled.reason, "task_cancelled");
  const expired = classifyTrackMCPOutcome(event({ event_type: "protocol", task_id: "task_1", mcp_method: "tasks/get", payload: { status: "expired" } }));
  assert.equal(expired.outcome, "unknown");
  assert.equal(expired.reason, "task_expired");
  assert.equal(expired.task_status, "expired");
});
