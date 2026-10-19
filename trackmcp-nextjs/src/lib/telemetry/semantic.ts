import type { CanonicalTrackMCPEvent } from "./types.ts";

/**
 * The semantic contract is deliberately independent of the transport event
 * schema.  Event schema 1 describes what was observed; this contract
 * describes the bounded interpretation we are willing to show in product
 * surfaces.  A classifier version makes historical re-computation explicit.
 */
export const TRACKMCP_SEMANTIC_CONTRACT_VERSION = "1" as const;
export const TRACKMCP_CLASSIFIER_VERSION = "1" as const;

export type TrackMCPSemanticScope = "tool_call" | "workflow" | "task" | "session" | "transport" | "event";
export type TrackMCPOutcome = "completed" | "failed" | "pending" | "unknown" | "not_observable";
export type TrackMCPEvidenceQuality = "observed" | "inferred" | "insufficient_data" | "conflicting";
export type TrackMCPOutcomeReason =
  | "explicit_success"
  | "explicit_error"
  | "workflow_completed"
  | "workflow_failed"
  | "workflow_pending"
  | "task_completed"
  | "task_failed"
  | "task_pending"
  | "task_cancelled"
  | "task_expired"
  | "conflicting_signals"
  | "missing_terminal_signal"
  | "input_required"
  | "not_an_outcome_event";

/** Non-outcome protocol observations that are useful for lifecycle analytics. */
export type TrackMCPProtocolSignal =
  | "notification"
  | "progress"
  | "catalog_changed"
  | "subscription_started"
  | "subscription_stopped";

export type TrackMCPDataQualityFlag =
  | "legacy_schema"
  | "missing_observation_source"
  | "missing_correlation"
  | "missing_terminal_signal"
  | "conflicting_result_signals"
  | "uninspectable_result"
  | "unsupported_protocol_version";

export type TrackMCPDataQuality = {
  flags: TrackMCPDataQualityFlag[];
  score: "good" | "degraded" | "insufficient";
};

export type TrackMCPSemanticOutcome = {
  contract_version: typeof TRACKMCP_SEMANTIC_CONTRACT_VERSION;
  classifier_version: typeof TRACKMCP_CLASSIFIER_VERSION;
  source_event_id: string;
  scope: TrackMCPSemanticScope;
  outcome: TrackMCPOutcome;
  evidence_quality: TrackMCPEvidenceQuality;
  reason: TrackMCPOutcomeReason;
  /** Explicit task state when the event carries a task identifier; never inferred from silence. */
  task_status?: "working" | "input_required" | "completed" | "failed" | "cancelled" | "expired";
  protocol_signal?: TrackMCPProtocolSignal;
  data_quality: TrackMCPDataQuality;
};

export type TrackMCPSemanticEvent = {
  contract_version: typeof TRACKMCP_SEMANTIC_CONTRACT_VERSION;
  classifier_version: typeof TRACKMCP_CLASSIFIER_VERSION;
  source_event_id: string;
  event_type: CanonicalTrackMCPEvent["event_type"];
  scope: TrackMCPSemanticScope;
  outcome: TrackMCPSemanticOutcome;
};

function qualityForEvent(event: CanonicalTrackMCPEvent, extra: TrackMCPDataQualityFlag[] = []): TrackMCPDataQuality {
  const flags = [...extra];
  if (event.schema_version !== "1") flags.push("legacy_schema");
  if (!event.observation_source) flags.push("missing_observation_source");
  if (!event.session_id && !event.workflow_id && !event.correlation_handle) flags.push("missing_correlation");
  if (event.payload_policy === "metadata" && event.event_type === "tool_call" && event.success === undefined && event.is_error === undefined) flags.push("uninspectable_result");
  const unique = [...new Set(flags)];
  return { flags: unique, score: unique.some((flag) => flag === "conflicting_result_signals" || flag === "unsupported_protocol_version") ? "insufficient" : unique.length ? "degraded" : "good" };
}

function scopeForEvent(event: CanonicalTrackMCPEvent): TrackMCPSemanticScope {
  if (event.task_id && (event.mcp_method?.startsWith("tasks/") || event.event_type === "protocol")) return "task";
  if (event.event_type === "tool_call") return "tool_call";
  if (event.event_type === "workflow") return "workflow";
  if (event.event_type === "session") return "session";
  if (event.event_type === "protocol") return "transport";
  return "event";
}

function taskStatus(event: CanonicalTrackMCPEvent): "working" | "input_required" | "completed" | "failed" | "cancelled" | "expired" | undefined {
  if (!event.task_id) return undefined;
  const value = event.payload?.task_status ?? event.payload?.status;
  return value === "working" || value === "input_required" || value === "completed" || value === "failed" || value === "cancelled" || value === "expired" ? value : undefined;
}

function workflowStatus(event: CanonicalTrackMCPEvent): string | undefined {
  return event.payload?.name === "workflow" && typeof event.payload.status === "string" ? event.payload.status : undefined;
}

function protocolResultType(event: CanonicalTrackMCPEvent): "complete" | "input_required" | "task" | undefined {
  if (event.result_type) return event.result_type;
  // MCP resultType was added after earlier protocol versions. For the two
  // request/response families where it is defined, absent means complete for
  // backwards compatibility; it must not be applied to arbitrary events.
  if (event.mcp_method === "resources/read" || event.mcp_method === "prompts/get") return "complete";
  return undefined;
}

export function classifyTrackMCPProtocolSignal(event: { mcp_method?: string | null }): TrackMCPProtocolSignal | undefined {
  const method = event.mcp_method;
  if (!method) return undefined;
  if (method === "resources/subscribe") return "subscription_started";
  if (method === "resources/unsubscribe") return "subscription_stopped";
  // Modern 2026-07-28 subscriptions replace the legacy subscribe RPC with a
  // long-lived listen request and an acknowledgement notification. The
  // stream's eventual close is represented by its terminal response event;
  // it must never be inferred from silence.
  if (method === "subscriptions/listen" || method === "notifications/subscriptions/acknowledged") return "subscription_started";
  if (method === "notifications/progress") return "progress";
  if (method === "notifications/tools/list_changed" || method === "notifications/resources/list_changed" || method === "notifications/prompts/list_changed") return "catalog_changed";
  if (method.startsWith("notifications/")) return "notification";
  return undefined;
}

/** Classify only evidence present on the event; never infer success from absence of an error. */
export function classifyTrackMCPOutcome(event: CanonicalTrackMCPEvent): TrackMCPSemanticOutcome {
  const scope = scopeForEvent(event);
  const status = workflowStatus(event);
  const task = taskStatus(event);
  const resultType = protocolResultType(event);
  const conflicting = event.success === true && event.is_error === true;
  let outcome: TrackMCPOutcome = "not_observable";
  let evidence_quality: TrackMCPEvidenceQuality = "insufficient_data";
  let reason: TrackMCPOutcomeReason = "not_an_outcome_event";
  const flags: TrackMCPDataQualityFlag[] = [];

  if (conflicting) {
    outcome = "unknown";
    evidence_quality = "conflicting";
    reason = "conflicting_signals";
    flags.push("conflicting_result_signals");
  } else if (event.is_error === true) {
    outcome = "failed";
    evidence_quality = "observed";
    reason = "explicit_error";
  } else if (task === "completed") {
    outcome = "completed";
    evidence_quality = "observed";
    reason = "task_completed";
  } else if (task === "failed") {
    outcome = "failed";
    evidence_quality = "observed";
    reason = "task_failed";
  } else if (task === "cancelled") {
    outcome = "unknown";
    evidence_quality = "observed";
    reason = "task_cancelled";
  } else if (task === "expired") {
    outcome = "unknown";
    evidence_quality = "observed";
    reason = "task_expired";
  } else if (task === "working" || task === "input_required") {
    outcome = "pending";
    evidence_quality = "observed";
    reason = "task_pending";
  } else if (resultType === "task") {
    // A task result is a durable handle, not a completed tool result. The
    // eventual outcome must come from tasks/get or a task notification.
    outcome = "pending";
    evidence_quality = "observed";
    reason = "task_pending";
  } else if (resultType === "input_required") {
    outcome = "pending";
    evidence_quality = "observed";
    reason = "input_required";
  } else if (resultType === "complete") {
    outcome = "completed";
    evidence_quality = "observed";
    reason = "explicit_success";
  } else if (status === "completed") {
    outcome = "completed";
    evidence_quality = "observed";
    reason = "workflow_completed";
  } else if (status === "failed") {
    outcome = "failed";
    evidence_quality = "observed";
    reason = "workflow_failed";
  } else if (status === "started" || status === "pending" || status === "running") {
    outcome = "pending";
    evidence_quality = "observed";
    reason = "workflow_pending";
  } else if ((scope === "tool_call" || scope === "workflow" || scope === "session") && event.success === true) {
    outcome = "completed";
    evidence_quality = "observed";
    reason = "explicit_success";
  } else if ((scope === "tool_call" || scope === "workflow" || scope === "session") && event.success === false) {
    outcome = "failed";
    evidence_quality = "observed";
    reason = "explicit_error";
  } else if (event.event_type === "tool_call" || event.event_type === "workflow" || event.event_type === "session") {
    outcome = "unknown";
    reason = "missing_terminal_signal";
    flags.push("missing_terminal_signal");
  }

  const data_quality = qualityForEvent(event, flags);
  const signal = classifyTrackMCPProtocolSignal(event);
  return {
    contract_version: TRACKMCP_SEMANTIC_CONTRACT_VERSION,
    classifier_version: TRACKMCP_CLASSIFIER_VERSION,
    source_event_id: event.event_id,
    scope,
    outcome,
    evidence_quality,
    reason,
    ...(signal ? { protocol_signal: signal } : {}),
    ...(task ? { task_status: task } : {}),
    data_quality,
  };
}

export function toTrackMCPSemanticEvent(event: CanonicalTrackMCPEvent): TrackMCPSemanticEvent {
  return { contract_version: TRACKMCP_SEMANTIC_CONTRACT_VERSION, classifier_version: TRACKMCP_CLASSIFIER_VERSION, source_event_id: event.event_id, event_type: event.event_type, scope: scopeForEvent(event), outcome: classifyTrackMCPOutcome(event) };
}
