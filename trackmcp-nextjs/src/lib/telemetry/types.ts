export type TrackMCPEventType = "protocol" | "tool_call" | "session" | "catalog" | "workflow" | "custom";

export type TrackMCPEvent = {
  event_id: string;
  event_type: TrackMCPEventType;
  service: string;
  environment: string;
  server_id?: string;
  deployment_id?: string;
  server_version?: string;
  sdk_version?: string;
  direction?: "client_to_server" | "server_to_client";
  transport?: "stdio" | "streamable_http" | "sse" | "custom";
  protocol_version?: string;
  mcp_method?: string;
  request_id?: string;
  session_id?: string;
  task_id?: string;
  workflow_id?: string;
  client_name?: string;
  tool_name?: string;
  started_at: string;
  duration_ms?: number;
  success?: boolean;
  is_error?: boolean;
  error_class?: string;
  error_code?: number;
  retry_number?: number;
  schema_hash?: string;
  payload_size_bytes?: number;
  payload?: Record<string, unknown>;
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
