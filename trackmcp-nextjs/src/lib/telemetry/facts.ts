import { createHash } from "node:crypto";
import { classifyTrackMCPOutcome, protocolFamilyForMethod, type TrackMCPProtocolFamily, type TrackMCPSemanticOutcome } from "./semantic.ts";
import type { CanonicalTrackMCPEvent } from "./types.ts";

/**
 * Versioned, bounded read-model fact.  This is a projection, not a second
 * event store: raw payloads and correlation identifiers are deliberately not
 * copied into product-facing facts.
 */
export const TRACKMCP_FACT_CONTRACT_VERSION = "1" as const;

export type TrackMCPFactType = "activity" | "outcome" | "observation";

export type TrackMCPFact = {
  fact_version: typeof TRACKMCP_FACT_CONTRACT_VERSION;
  fact_type: TrackMCPFactType;
  source_event_id: string;
  observed_at: string;
  event_type: CanonicalTrackMCPEvent["event_type"];
  service: string;
  environment: string;
  semantic: TrackMCPSemanticOutcome;
  dimensions: {
    client_name?: string;
    client_version?: string;
    tool_name?: string;
    transport?: CanonicalTrackMCPEvent["transport"];
    account_key?: string;
    account_identity_source?: CanonicalTrackMCPEvent["account_identity_source"];
    resource_audience?: CanonicalTrackMCPEvent["resource_audience"];
    resource_priority?: number;
    interaction_id?: string;
    /** One-way task handle; raw task IDs are never stored in the fact projection. */
    task_id_hash?: string;
    /** Coarse protocol family; raw method names remain in the source event only. */
    protocol_family?: ReturnType<typeof protocolFamilyForMethod>;
  };
  measures: {
    duration_ms?: number;
    payload_size_bytes?: number;
    retry_number?: number;
    input_request_count?: number;
    input_response_count?: number;
  };
  error?: {
    class?: string;
    code?: number;
  };
};

const bounded = (value: string | undefined, max: number): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, max) : undefined;
};

const boundedNonNegative = (value: number | undefined, max: number): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(0, value)) : undefined;

const protocolFamilyForEvent = (event: CanonicalTrackMCPEvent): TrackMCPProtocolFamily | undefined => {
  const fromMethod = protocolFamilyForMethod(event.mcp_method);
  if (fromMethod) return fromMethod;
  const payload = event.payload;
  const metadata = payload && typeof payload === "object" && !Array.isArray(payload) ? payload._trackmcp : undefined;
  const hinted = metadata && typeof metadata === "object" && !Array.isArray(metadata) ? (metadata as Record<string, unknown>).protocol_family : undefined;
  return hinted === "sampling" || hinted === "elicitation" || hinted === "completion" || hinted === "tasks" || hinted === "control_signal" || hinted === "resources" || hinted === "prompts" || hinted === "tools" || hinted === "subscriptions" || hinted === "notifications" ? hinted : undefined;
};

function factTypeFor(event: CanonicalTrackMCPEvent): TrackMCPFactType {
  if (event.event_type === "tool_call") return "activity";
  if (event.event_type === "workflow" || event.event_type === "session") return "outcome";
  return "observation";
}

/**
 * Project one canonical transport event into the safe shape consumed by
 * future dashboards and analyst queries. The original event remains the
 * source of truth; this function does not persist anything or emit network
 * traffic.
 */
export function projectTrackMCPFact(event: CanonicalTrackMCPEvent): TrackMCPFact {
  const semantic = classifyTrackMCPOutcome(event);
  const taskId = bounded(event.task_id, 256);
  const fact: TrackMCPFact = {
    fact_version: TRACKMCP_FACT_CONTRACT_VERSION,
    fact_type: factTypeFor(event),
    source_event_id: bounded(event.event_id, 128) ?? "unknown",
    observed_at: event.started_at,
    event_type: event.event_type,
    service: bounded(event.service, 128) ?? "unknown",
    environment: bounded(event.environment, 64) ?? "unknown",
    semantic,
    dimensions: {
      client_name: bounded(event.client_name, 128),
      client_version: bounded(event.client_version, 64),
      tool_name: bounded(event.tool_name, 256),
      transport: event.transport,
      account_key: bounded(event.account_key, 64),
      account_identity_source: event.account_identity_source,
      ...(event.resource_audience ? { resource_audience: event.resource_audience } : {}),
      ...(boundedNonNegative(event.resource_priority, 1) !== undefined ? { resource_priority: boundedNonNegative(event.resource_priority, 1) } : {}),
      ...(bounded(event.interaction_id, 128) ? { interaction_id: bounded(event.interaction_id, 128) } : {}),
      ...(taskId ? { task_id_hash: createHash("sha256").update(taskId, "utf8").digest("hex") } : {}),
      ...(protocolFamilyForEvent(event) ? { protocol_family: protocolFamilyForEvent(event) } : {}),
    },
    measures: {
      duration_ms: boundedNonNegative(event.duration_ms, 86_400_000),
      payload_size_bytes: boundedNonNegative(event.payload_size_bytes, 100_000_000),
      retry_number: boundedNonNegative(event.retry_number, 1_000),
      ...(boundedNonNegative(event.input_request_count, 100) !== undefined ? { input_request_count: boundedNonNegative(event.input_request_count, 100) } : {}),
      ...(boundedNonNegative(event.input_response_count, 100) !== undefined ? { input_response_count: boundedNonNegative(event.input_response_count, 100) } : {}),
    },
  };

  if (event.error_class || typeof event.error_code === "number") {
    fact.error = {
      class: bounded(event.error_class, 128),
      code: typeof event.error_code === "number" && Number.isFinite(event.error_code) ? event.error_code : undefined,
    };
  }
  return fact;
}
