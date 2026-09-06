export type TrackMCPEventType = "protocol" | "tool_call" | "session" | "catalog" | "workflow" | "custom";
export type TrackMCPSchemaVersion = "1" | "legacy" | (string & {});
export const TRACKMCP_SCHEMA_VERSION = "1" as const;
export const TRACKMCP_LEGACY_SCHEMA_VERSION = "legacy" as const;

export type TrackMCPDirection = "client_to_server" | "server_to_client";
export type TrackMCPTransport = "stdio" | "streamable_http" | "sse" | "custom";
export type TrackMCPPayloadPolicy = "metadata" | "redacted" | "full";
export type TrackMCPSessionIdSource = "protocol" | "transport_generated" | "external" | "missing";
export type TrackMCPCorrelationHandleSource = "external" | "issued" | "missing";
export type TrackMCPIntentSource = "context_parameter" | "external_callback" | "fallback" | "missing";

export type TrackMCPEvent = {
  /** Optional only for legacy input. Newly emitted SDK events always set this to "1". */
  schema_version?: TrackMCPSchemaVersion;
  event_id: string;
  event_type: TrackMCPEventType;
  service: string;
  environment: string;
  server_id?: string;
  deployment_id?: string;
  server_version?: string;
  sdk_version?: string;
  direction?: TrackMCPDirection;
  transport?: TrackMCPTransport;
  protocol_version?: string;
  mcp_method?: string;
  request_id?: string;
  session_id?: string;
  session_id_source?: TrackMCPSessionIdSource;
  correlation_handle?: string;
  correlation_handle_source?: TrackMCPCorrelationHandleSource;
  context?: string;
  intent_source?: TrackMCPIntentSource;
  missing_capability?: string;
  task_id?: string;
  workflow_id?: string;
  client_name?: string;
  client_version?: string;
  tool_name?: string;
  tool_description?: string;
  tool_description_hash?: string;
  started_at: string;
  duration_ms?: number;
  success?: boolean;
  is_error?: boolean;
  error_class?: string;
  error_code?: number;
  retry_number?: number;
  schema_hash?: string;
  payload_size_bytes?: number;
  payload_policy?: TrackMCPPayloadPolicy;
  payload?: Record<string, unknown>;
};

export type CanonicalTrackMCPEvent = Omit<TrackMCPEvent, "schema_version"> & {
  schema_version: string;
};

export type TrackMCPBatch = { events: TrackMCPEvent[] };

export type TrackMCPOptions = {
  apiKey: string;
  service?: string;
  environment?: string;
  endpoint?: string;
  sampleRate?: number;
  redact?: string[];
  disabled?: boolean;
  flushIntervalMs?: number;
  maxBatchSize?: number;
};
