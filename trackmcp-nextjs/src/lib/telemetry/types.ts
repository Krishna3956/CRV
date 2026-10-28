export type TrackMCPEventType = "protocol" | "tool_call" | "session" | "catalog" | "workflow" | "custom";
export type TrackMCPSchemaVersion = "1" | "legacy" | (string & {});
export const TRACKMCP_SCHEMA_VERSION = "1" as const;
export const TRACKMCP_LEGACY_SCHEMA_VERSION = "legacy" as const;

export type TrackMCPDirection = "client_to_server" | "server_to_client";
export type TrackMCPTransport = "stdio" | "streamable_http" | "sse" | "custom";
export type TrackMCPObservationSource = "client" | "server";
export type TrackMCPPayloadPolicy = "metadata" | "redacted" | "full";
export type TrackMCPSessionIdSource = "protocol" | "transport_generated" | "external" | "missing";
export type TrackMCPCorrelationHandleSource = "external" | "issued" | "missing";
export type TrackMCPIntentSource = "context_parameter" | "external_callback" | "fallback" | "missing";
export type TrackMCPAccountIdentitySource = "resolver" | "unresolved";
/** Version of the one-way account identity derivation contract. */
export type TrackMCPAccountIdentityVersion = "sha256-v1";
export const TRACKMCP_ACCOUNT_IDENTITY_VERSION = "sha256-v1" as const;
export type TrackMCPCatalogKind = "tools" | "resources" | "resource_templates" | "prompts";
/** Protocol-level result state. Missing values remain backward-compatible and are treated as complete. */
export type TrackMCPResultType = "complete" | "input_required" | "task";
/** Bounded, privacy-safe linkage for multi-round-trip requests; never raw inputResponses/requestState. */
export type TrackMCPInteractionLinkSource = "request_id" | "external" | "issued" | "missing";

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
  observation_source?: TrackMCPObservationSource;
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
  /** One-way bounded account identifier; never a raw email, token, or client identity. */
  account_key?: string;
  account_identity_source?: TrackMCPAccountIdentitySource;
  /** Present whenever account_key is present; prevents silent joins across rotations. */
  account_identity_version?: TrackMCPAccountIdentityVersion;
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
  result_type?: TrackMCPResultType;
  /** Explicit task lifecycle state; raw task handles remain hash-only. */
  task_status?: "working" | "input_required" | "completed" | "failed" | "cancelled" | "expired";
  /** Hash/opaque handle linking a stalled request to a retry without storing input values. */
  interaction_id?: string;
  interaction_link_source?: TrackMCPInteractionLinkSource;
  retry_of_event_id?: string;
  request_state_hash?: string;
  /** Bounded count of server input requests; raw requests are never stored. */
  input_request_count?: number;
  input_response_count?: number;
  resource_audience?: "user" | "assistant";
  resource_priority?: number;
  schema_hash?: string;
  /** Privacy-safe catalog metadata; identifiers are one-way hashes, never raw names/URIs. */
  catalog_kind?: TrackMCPCatalogKind;
  catalog_item_count?: number;
  catalog_item_name_hashes?: string[];
  catalog_item_uri_hashes?: string[];
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
